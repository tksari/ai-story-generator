import { inject, injectable } from "tsyringe";
import { LogService } from "@/infrastructure/logging/log.service";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { GeneratedVideoRepository } from "@/domain/story/page/generated-video/generated-video.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { GeneratedVideo, JobStatus } from "@prisma/client";
import { HttpError } from "@/middleware/error-handler";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobType } from "@prisma/client";
import { JobService } from "@/domain/job/job.service";
import { GeneratedVideoInput, generatedVideoSchema } from "./generated-video.schema";

@injectable()
export class GeneratedVideoService {
  constructor(
    @inject("GeneratedVideoRepository")
    private generatedVideoRepository: GeneratedVideoRepository,
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("QueueService") private queueService: QueueService,
    @inject("LogService") private logService: LogService,
    @inject("StorageService") private storageService: StorageService,
    @inject("JobService") private jobService: JobService
  ) {}

  async queueVideoGeneration(data: GeneratedVideoInput): Promise<GeneratedVideo> {
    const { storyId } = generatedVideoSchema.parse(data);

    const story = await this.storyRepository.getStoryWithPages(storyId);

    if (!story) {
      throw new Error(`Story not found with ID: ${storyId}`);
    }

    if (!story.pages || story.pages.length === 0) {
      throw new Error(`Story has no pages: ${storyId}`);
    }

    await this.jobService.assertNoActiveJob(story.id, [JobType.PAGE]);

    const video = await this.generatedVideoRepository.create({
      storyId: story.id,
      title: story.title,
      prompt: "",
      path: "",
    });

    const job = await this.jobService.createJob({
      type: JobType.VIDEO,
      storyId,
      metadata: {
        generationConfig: story.generationConfig,
      },
    });

    await this.queueService.sendVideoGenerateMessage({
      storyId,
      videoId: video.id,
      taskId: job.taskId,
    });

    this.logService.info(`Queued video generation for story: ${storyId}`);

    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    const video = await this.generatedVideoRepository.findById(id);

    if (!video) throw new HttpError(404, "Video not found");

    if (video.status === JobStatus.IN_PROGRESS) {
      throw new HttpError(400, "Video is still being generated");
    }

    if (video.path) {
      try {
        await this.storageService.deleteFileIfExists(video.path);
      } catch (err: any) {
        this.logService.warn(`Failed to delete file for video ID ${id}: ${err.message}`);
      }
    }

    await this.generatedVideoRepository.delete(id);
  }
}
