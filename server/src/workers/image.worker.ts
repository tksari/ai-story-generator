import "reflect-metadata";
import { container } from "tsyringe";
import { BaseWorker } from "./base-worker";
import { QueueMessage } from "@/infrastructure/queue/queue.service";
import { GeneratedImageService } from "@/domain/story/page/generated-image/generated-image.service";
import { QUEUES } from "@/infrastructure/queue/queues";

class ImageWorker extends BaseWorker {
  private generatedImageService: GeneratedImageService;

  constructor() {
    super();
  }

  protected getQueueName(): string {
    return QUEUES.IMAGE_GENERATE;
  }

  protected initializeServices(): void {
    this.generatedImageService = container.resolve<GeneratedImageService>("GeneratedImageService");
  }

  protected async handleMessage(message: QueueMessage): Promise<void> {
    const { taskId, storyId, pageId, id, content, generationConfig } = message.data;
    await this.generatedImageService.handleImageGeneration(
      taskId,
      storyId,
      pageId,
      id,
      content,
      generationConfig
    );
  }
}

const worker = new ImageWorker();
worker.start().catch((error) => {
  console.error("Failed to start image worker:", error);
  process.exit(1);
});
