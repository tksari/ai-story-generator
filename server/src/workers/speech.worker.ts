import "reflect-metadata";
import { container } from "tsyringe";
import { BaseWorker } from "./base-worker";
import { QueueMessage } from "@/infrastructure/queue/queue.service";
import { GeneratedSpeechService } from "@/domain/story/page/generated-speech/generated-speech.service";
import { QUEUES } from "@/infrastructure/queue/queues";

class SpeechWorker extends BaseWorker {
  private generatedSpeechService: GeneratedSpeechService;

  constructor() {
    super();
  }

  protected getQueueName(): string {
    return QUEUES.SPEECH_GENERATE;
  }

  protected initializeServices(): void {
    this.generatedSpeechService =
      container.resolve<GeneratedSpeechService>("GeneratedSpeechService");
  }

  protected async handleMessage(message: QueueMessage): Promise<void> {
    const { taskId, storyId, speechId, pageId, content } = message.data;
    await this.generatedSpeechService.handleSpeechGeneration(
      taskId,
      storyId,
      speechId,
      pageId,
      content
    );
  }
}

const worker = new SpeechWorker();
worker.start().catch((error) => {
  console.error("Failed to start audio worker:", error);
  process.exit(1);
});
