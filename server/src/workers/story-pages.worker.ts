import "reflect-metadata";
import { container } from "tsyringe";
import { BaseWorker } from "./base-worker";
import { QueueMessage } from "@/infrastructure/queue/queue.service";
import { PageService } from "@/domain/story/page/page.service";
import { QUEUES } from "@/infrastructure/queue/queues";

class StoryPagesWorker extends BaseWorker {
  private pageService: PageService;

  constructor() {
    super();
  }

  protected getQueueName(): string {
    return QUEUES.STORY_PAGE_GENERATE;
  }

  protected initializeServices(): void {
    this.pageService = container.resolve<PageService>("PageService");
  }

  protected async handleMessage(message: QueueMessage): Promise<void> {
    const { taskId, storyId, pageCount = 1, isEndStory = false } = message.data;
    await this.pageService.generateStoryPagesJob(taskId, storyId, pageCount, isEndStory);
  }
}

const worker = new StoryPagesWorker();
worker.start().catch((error) => {
  console.error("Failed to start generate story pages worker:", error);
  process.exit(1);
});
