import "reflect-metadata";
import { container } from "tsyringe";
import { VideoService } from "@/domain/video/video.service";
import { BaseWorker } from "./base-worker";
import { QueueMessage } from "@/infrastructure/queue/queue.service";
import { QUEUES } from "@/infrastructure/queue/queues";

class VideoWorker extends BaseWorker {
  private videoService: VideoService;

  constructor() {
    super();
  }

  protected getQueueName(): string {
    return QUEUES.VIDEO_GENERATE;
  }

  protected initializeServices(): void {
    this.videoService = container.resolve<VideoService>("VideoService");
  }

  protected async handleMessage(message: QueueMessage): Promise<void> {
    const { storyId, videoId, taskId } = message.data;
    await this.videoService.handleVideoGeneration(taskId, storyId, videoId);
  }
}

const worker = new VideoWorker();
worker.start().catch((error) => {
  console.error("Failed to start video worker:", error);
  process.exit(1);
});
