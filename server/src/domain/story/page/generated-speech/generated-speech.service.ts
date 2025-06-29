import { inject, injectable } from "tsyringe";
import { LogService } from "@/infrastructure/logging/log.service";
import { ConfigService } from "@/config/config.service";
import { HttpError } from "@/middleware/error-handler";
import { PageRepository } from "@/domain/story/page/page.repository";
import { JobService } from "@/domain/job/job.service";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { JobType, JobStatus } from "@prisma/client";
import { CapabilityType } from "@prisma/client";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { ProviderInstanceResolver } from "@/providers/ProviderInstanceResolver";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { GeneratedSpeechRepository } from "@/domain/story/page/generated-speech/generated-speech.repository";
import { genSpeechFileName } from "@/utils/index";
import { VoiceRepository } from "@/domain/providers/voice/voice.repository";

@injectable()
export class GeneratedSpeechService {
  private SPEECH_OUTPUT_PATH: string;

  constructor(
    @inject("GeneratedSpeechRepository")
    private speechRepo: GeneratedSpeechRepository,
    @inject("LogService") private logService: LogService,
    @inject("ConfigService") private configService: ConfigService,
    @inject("PageRepository") private pageRepo: PageRepository,
    @inject("JobService") private jobService: JobService,
    @inject("QueueService") private queueService: QueueService,
    @inject("StorageService") private storageService: StorageService,
    @inject("VoiceRepository") private voiceRepo: VoiceRepository,
    @inject("ProviderInstanceResolver")
    private providerInstanceResolver: ProviderInstanceResolver,
    @inject("EventEmitterService") private eventEmitter: EventEmitterService
  ) {
    this.SPEECH_OUTPUT_PATH = this.configService.get("storage.paths.speeches");
  }

  async setDefaultSpeech(speechId: number) {
    const speech = await this.speechRepo.findById(speechId);

    if (!speech) throw new HttpError(404, "Speech not found");

    return await this.speechRepo.setDefault(speechId, speech?.pageId);
  }

  async deleteSpeech(id: number) {
    const speech = await this.speechRepo.findById(id);
    if (!speech) throw new HttpError(404, "Speech not found");

    if (speech?.isDefault) throw new HttpError(400, "Cannot delete default speech");

    if (speech.path) {
      try {
        await this.storageService.deleteFileIfExists(speech.path, this.SPEECH_OUTPUT_PATH);
      } catch (err: any) {
        this.logService.warn(`Failed to delete file for speech ID ${id}: ${err.message}`);
      }
    }

    await this.speechRepo.delete(id);
  }

  private async generateSpeechForPage(page: {
    id: number;
    storyId: number;
    content: string;
    pageNumber: number;
  }) {
    const speech = await this.speechRepo.create({
      pageId: page.id,
      text: page.content,
      path: "",
    });

    const task = await this.jobService.createJob({
      type: JobType.SPEECH,
      pageId: page.id,
      metadata: {
        content: page.content.substring(0, 100) + (page.content.length > 100 ? "..." : ""),
        pageNumber: page.pageNumber,
        id: speech.id,
      },
    });

    await this.queueService.sendTTSGenerateMessage({
      taskId: task.taskId,
      storyId: page.storyId,
      speechId: speech.id,
      pageId: page.id,
      content: page.content,
    });

    return speech;
  }

  async generateSpeechForSinglePage(pageId: number) {
    const page = await this.pageRepo.findById(pageId);
    if (!page) throw new HttpError(404, "Page not found");

    return this.generateSpeechForPage(page);
  }

  async generateSpeechForAllPages(storyId: number) {
    const hasAllContent = await this.pageRepo.hasAllPagesContent(storyId);
    if (!hasAllContent) {
      throw new HttpError(400, "All pages must have content before generating speeches");
    }

    await this.jobService.assertNoActiveJob(storyId, [JobType.PAGE, JobType.VIDEO]);

    const pages = await this.pageRepo.getPagesWithContentByStoryId(storyId);

    const generatedSpeeches = await Promise.all(
      pages.map((page) => this.generateSpeechForPage(page))
    );

    return generatedSpeeches;
  }

  async handleSpeechGeneration(
    taskId: string,
    storyId: number,
    id: number,
    pageId: number,
    content: string
  ): Promise<void> {
    try {
      this.logService.info(
        `Processing speech generation for story ID: ${storyId}, page: ${pageId}`
      );

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.SPEECH}:${JobStatus.IN_PROGRESS}`,
        {
          storyId,
          pageId,
          id: id,
        }
      );

      const resolvedProvider = await this.providerInstanceResolver.resolveInstance(
        CapabilityType.TEXT_TO_SPEECH
      );

      if (!resolvedProvider?.instance || !resolvedProvider?.provider) {
        throw new Error("No text-to-speech provider available");
      }

      const voice = await this.voiceRepo.findDefaultByProviderId(resolvedProvider.provider.id);

      if (!voice) {
        throw new Error(`No default voice found for provider "${resolvedProvider.provider.name}"`);
      }

      const speech = await resolvedProvider.instance.generateSpeech({ text: content }, voice);

      const path = await this.saveSpeechFile(storyId, id, speech.file);
      const existingSpeeches = await this.speechRepo.findByPageId(pageId);

      const isDefault = existingSpeeches.length === 1;

      await Promise.all([
        this.speechRepo.update(id, { path, status: JobStatus.DONE, isDefault }),
        this.eventEmitter.emit(
          `${JobType.STORY}:${storyId}`,
          `${JobType.SPEECH}:${JobStatus.DONE}`,
          {
            storyId,
            pageId,
            id,
            path,
            isDefault,
          }
        ),
        this.jobService.completeJob(taskId, { id }),
      ]);

      this.logService.info(`Completed speech generation for story ID: ${storyId}, page: ${pageId}`);

      this.jobService.completeJob(taskId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logService.error(`Error in speech generation: ${errorMessage}`);

      const metadata = {
        id,
        pageId,
        storyId,
        error: errorMessage,
      };

      await Promise.all([
        this.speechRepo.update(id, {
          status: JobStatus.FAILED,
          isDefault: false,
        }),
        this.eventEmitter.emit(
          `${JobType.STORY}:${storyId}`,
          `${JobType.SPEECH}:${JobStatus.FAILED}`,
          metadata
        ),
        this.jobService.failJob(taskId, errorMessage, metadata),
      ]);
    }
  }

  private async saveSpeechFile(storyId: number, speechId: number, file: Buffer): Promise<string> {
    const outputFilename = genSpeechFileName({
      id: `${storyId}${speechId}`,
      extension: "mp3",
    });
    const outputPath = this.storageService.getPath(this.SPEECH_OUTPUT_PATH, outputFilename);

    await this.storageService.saveFile(outputPath, file);
    return outputPath;
  }
}
