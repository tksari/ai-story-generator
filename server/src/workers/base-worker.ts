import { container } from "tsyringe";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { RedisService } from "@/infrastructure/redis/redis.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { QueueMessage } from "@/infrastructure/queue/queue.service";
import { initializeContainer } from "../di-container";

export abstract class BaseWorker {
  protected logService: LogService;
  protected queueService: QueueService;
  protected redisService: RedisService;

  constructor() {}

  protected abstract getQueueName(): string;
  protected abstract handleMessage(message: QueueMessage): Promise<void>;
  protected abstract initializeServices(): void;

  protected async initialize(): Promise<void> {
    try {
      await initializeContainer();

      this.logService = container.resolve<LogService>("LogService");
      this.queueService = container.resolve<QueueService>("QueueService");
      this.redisService = container.resolve<RedisService>("RedisService");

      await this.redisService.initialize();

      await this.queueService.initialize();

      this.initializeServices();

      this.logService.info(`Worker initialized for queue: ${this.getQueueName()}`);
    } catch (error) {
      this.logService?.error(
        `Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  protected async startConsuming(): Promise<void> {
    try {
      await this.queueService.consumeQueue(this.getQueueName(), async (message: QueueMessage) => {
        try {
          this.logService.info(`Processing message from ${this.getQueueName()}: ${message.id}`);
          await this.handleMessage(message);
        } catch (error) {
          this.logService.error(
            `Error in message processing: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      });

      this.logService.info(`Started consuming messages from queue: ${this.getQueueName()}`);

      this.setupGracefulShutdown();
    } catch (error) {
      this.logService?.error(
        `Failed to start consuming messages: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    await this.startConsuming();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (): Promise<void> => {
      this.logService.info("Worker shutting down...");

      try {
        await this.queueService.close(true);
        await this.redisService.close();

        process.exit(0);
      } catch (error) {
        this.logService.error(`Error during shutdown: ${error}`);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => {
      this.logService.info("Received SIGINT signal");
      void gracefulShutdown();
    });

    process.on("SIGTERM", () => {
      this.logService.info("Received SIGTERM signal");
      void gracefulShutdown();
    });
  }
}
