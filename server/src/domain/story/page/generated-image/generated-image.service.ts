import { inject, injectable } from "tsyringe";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { JobService } from "@/domain/job/job.service";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { GeneratedImageRepository } from "@/domain/story/page/generated-image/generated-image.repository";
import { PageRepository } from "@/domain/story/page/page.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { HttpError } from "@/middleware/error-handler";
import { GeneratedImage } from "@/types/generated-image.types";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { ProviderInstanceResolver } from "@/providers/ProviderInstanceResolver";
import { PromptService } from "@/core/prompt/prompt.service";
import { CapabilityType, JobStatus, JobType } from "@prisma/client";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { genImageFileName } from "@/utils/index";

@injectable()
export class GeneratedImageService {
  private IMAGE_OUTPUT_PATH: string;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService,
    @inject("JobService") private jobService: JobService,
    @inject("QueueService") private queueService: QueueService,
    @inject("GeneratedImageRepository")
    private generatedImageRepository: GeneratedImageRepository,
    @inject("PageRepository") private pageRepository: PageRepository,
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("EventEmitterService") private eventEmitter: EventEmitterService,
    @inject("ProviderInstanceResolver")
    private providerInstanceResolver: ProviderInstanceResolver,
    @inject("PromptService") private promptService: PromptService,
    @inject("StorageService") private storageService: StorageService
  ) {
    this.IMAGE_OUTPUT_PATH = this.configService.get("storage.paths.images");
  }

  async setDefault(id: number): Promise<GeneratedImage> {
    const image = await this.generatedImageRepository.findById(id);
    if (!image) throw new HttpError(404, "Image not found");
    return await this.generatedImageRepository.setDefault(id, image.pageId);
  }

  async deleteImage(id: number): Promise<void> {
    const image = await this.generatedImageRepository.findById(id);
    if (!image) throw new HttpError(404, "Image not found");
    if (image.isDefault) throw new HttpError(400, "Cannot delete default image");
    if (image.path) {
      try {
        await this.storageService.deleteFileIfExists(image.path);
      } catch (err: any) {
        this.logService.warn(`Failed to delete file for image ID ${id}: ${err.message}`);
      }
    }
    await this.generatedImageRepository.delete(id);
  }

  private async generateImageForPage(
    page: { id: number; storyId: number; content: string; pageNumber: number },
    story: { id: number; generationConfig?: any; settings?: any }
  ) {
    const image = await this.generatedImageRepository.create({
      pageId: page.id,
      prompt: page.content,
      path: "",
    });

    const job = await this.jobService.createJob({
      type: JobType.IMAGE,
      pageId: page.id,
      metadata: {
        content: page.content.substring(0, 100) + (page.content.length > 100 ? "..." : ""),
        pageNumber: page.pageNumber,
        generationConfig: story.generationConfig || {},
        imageId: image.id,
      },
    });

    await this.queueService.sendImageGenerateMessage({
      taskId: job.taskId,
      storyId: story.id,
      id: image.id,
      pageId: page.id,
      content: page.content,
      generationConfig: story.generationConfig || {},
    });

    return image;
  }

  async generateImageForSinglePage(pageId: number): Promise<GeneratedImage> {
    const page = await this.pageRepository.findById(pageId);
    if (!page) {
      throw new HttpError(404, `Page not found for ID: ${pageId}`);
    }

    const story = await this.storyRepository.getStoryById(page.storyId);
    if (!story) {
      throw new HttpError(404, `Story not found for ID: ${page.storyId}`);
    }

    return this.generateImageForPage(page, story);
  }

  async generateImageForAllPages(storyId: number): Promise<GeneratedImage[]> {
    const story = await this.storyRepository.getStoryWithPages(storyId);
    if (!story) throw new HttpError(404, "Story not found");

    await this.jobService.assertNoActiveJob(story.id, [JobType.PAGE, JobType.VIDEO]);

    const pagesWithoutImages = story.pages.filter((page) => !page.imagePath);

    const generatedImages = await Promise.all(
      pagesWithoutImages.map((page) => this.generateImageForPage(page, story))
    );

    return generatedImages;
  }

  async handleImageGeneration(
    taskId: string,
    storyId: number,
    pageId: number,
    id: number,
    content: string,
    generationConfig: any
  ): Promise<void> {
    try {
      this.logService.info(
        `Processing image generation for story ID: ${storyId}, page: ${pageId}, imageId: ${id}`
      );

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.IMAGE}:${JobStatus.IN_PROGRESS}`,
        {
          storyId,
          pageId,
          id,
          status: JobStatus.IN_PROGRESS,
        }
      );

      const prompt = this.promptService.buildImagePrompt(content, generationConfig);
      const generatedImagePath = await this.generateImage(prompt, storyId, pageId);

      const existingImages = await this.generatedImageRepository.findByPageId(pageId);
      const isDefault = existingImages.length === 1;

      const image = await this.generatedImageRepository.update(id, {
        path: generatedImagePath,
        status: JobStatus.DONE,
        isDefault,
        metadata: {
          prompt,
          generationConfig,
          contentPreview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
        },
      });

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.IMAGE}:${JobStatus.IN_PROGRESS}`,
        {
          storyId,
          pageId,
          id,
          progress: 50,
          message: "Processing image: 50%",
          status: JobStatus.IN_PROGRESS,
        }
      );

      await this.jobService.updateJob(taskId, {
        status: JobStatus.DONE,
        metadata: {
          generationConfig,
          generatedImageId: image?.id,
        },
      });

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.IMAGE}:${JobStatus.DONE}`,
        {
          ...image,
        }
      );

      this.logService.info(
        `Completed image generation for story ID: ${storyId}, page: ${pageId}, imageId: ${id}`
      );
    } catch (error) {
      const status = JobStatus.FAILED;
      this.logService.error(
        `Error in image generation: ${error instanceof Error ? error.message : String(error)}`
      );
      await this.jobService.updateJob(taskId, {
        status,
      });
      await this.generatedImageRepository.update(id, {
        status,
      });

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.IMAGE}:${JobStatus.FAILED}`,
        {
          storyId,
          pageId,
          id,
          status,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private async generateImage(prompt: string, storyId: number, pageId: number): Promise<string> {
    try {
      const provider = await this.providerInstanceResolver.resolveInstance(
        CapabilityType.IMAGE_GENERATION
      );
      if (!provider) throw new Error("No image provider found");

      const result = await provider.instance.generateImage({ prompt, storyId });

      if (!result?.path) {
        throw new Error("Failed to generate image: No image URL returned");
      }

      const outputFilename = genImageFileName({
        id: `${storyId}${pageId}`,
        extension: "jpg",
      });

      const outputPath = this.storageService.getPath(this.IMAGE_OUTPUT_PATH, outputFilename);

      await this.storageService.downloadFileFromUrlAndSave(result.path, outputPath);
      this.logService.info(`Generated image saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logService.error(
        `Error generating image: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
