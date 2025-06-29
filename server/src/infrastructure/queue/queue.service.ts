import { inject, injectable } from "tsyringe";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { QUEUES } from "@/infrastructure/queue/queues";

import { Channel, ChannelModel, connect } from "amqplib";

export interface QueueMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

@injectable()
export class QueueService {
  private channelModel: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly queues = QUEUES;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService
  ) {
    this.close = this.close.bind(this);
  }

  /**
   * Initialize RabbitMQ connection and channels
   */
  async initialize(): Promise<void> {
    try {
      const host = this.configService.get("RABBITMQ_HOST") || "localhost";

      const port = this.configService.get("RABBITMQ_PORT");
      const username = this.configService.get("RABBITMQ_USERNAME");
      const password = this.configService.get("RABBITMQ_PASSWORD");
      const vhost = this.configService.get("RABBITMQ_VHOST") || "/";

      if (!host || !port || !username || !password) {
        throw new Error("RabbitMQ configuration is incomplete");
      }

      const amqpConnectionUrl = `amqp://${username}:${password}@${host}:${port}${vhost}`;

      this.logService.info(`Connecting to RabbitMQ at ${amqpConnectionUrl}`);

      this.channelModel = await connect(amqpConnectionUrl);

      if (!this.channelModel) {
        throw new Error("Failed to establish connection to RabbitMQ");
      }

      this.channel = await this.channelModel.createChannel();

      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }

      await this.channel.assertQueue(this.queues.STORY_PAGE_GENERATE, {
        durable: true,
      });
      await this.channel.assertQueue(this.queues.IMAGE_GENERATE, {
        durable: true,
      });
      await this.channel.assertQueue(this.queues.VIDEO_GENERATE, {
        durable: true,
      });

      await this.channel.assertQueue(this.queues.SPEECH_GENERATE, {
        durable: true,
      });

      this.logService.info("RabbitMQ connection established");

      let isIntentionalClose = false;
      this.channelModel.connection.on("close", () => {
        if (isIntentionalClose) {
          this.logService.info("RabbitMQ connection closed intentionally");
          return;
        }
        this.logService.error("RabbitMQ connection closed, attempting to reconnect...");
        setTimeout(() => this.initialize(), 5000);
      });
      this.channelModel.connection.on("error", (err) => {
        this.logService.error(`RabbitMQ connection error: ${err.message}`);
      });

      const originalClose = this.close;
      this.close = async (intentional: boolean = false) => {
        isIntentionalClose = intentional;
        await originalClose(intentional);
      };
    } catch (error) {
      this.logService.error(
        `Failed to initialize RabbitMQ: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Send a message to the story generation queue
   */
  async sendStoryGenerateMessage(data: any): Promise<void> {
    await this.sendMessage(this.queues.STORY_PAGE_GENERATE, {
      id: this.generateId(),
      type: QUEUES.STORY_PAGE_GENERATE,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a message to the image generation queue
   */
  async sendImageGenerateMessage(data: any): Promise<void> {
    await this.sendMessage(this.queues.IMAGE_GENERATE, {
      id: this.generateId(),
      type: QUEUES.IMAGE_GENERATE,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a message to the video generation queue
   */
  async sendVideoGenerateMessage(data: any): Promise<void> {
    await this.sendMessage(this.queues.VIDEO_GENERATE, {
      id: this.generateId(),
      type: QUEUES.VIDEO_GENERATE,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a message to the video generation queue
   */
  async sendTTSGenerateMessage(data: any): Promise<void> {
    await this.sendMessage(this.queues.SPEECH_GENERATE, {
      id: this.generateId(),
      type: QUEUES.SPEECH_GENERATE,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Consume messages from a queue with the provided callback
   */
  async consumeQueue(
    queueName: string,
    callback: (msg: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    if (!this.channel) {
      throw new Error("Failed to initialize RabbitMQ channel");
    }

    await this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const content = msg.content.toString();
          const parsedMessage = JSON.parse(content) as QueueMessage;

          this.logService.info(`Processing message from ${queueName}: ${parsedMessage.id}`);

          await callback(parsedMessage);

          if (this.channel) {
            this.channel.ack(msg);
          }
        } catch (error) {
          this.logService.error(
            `Error processing message from ${queueName}: ${error instanceof Error ? error.message : String(error)}`
          );

          if (this.channel) {
            this.channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );

    this.logService.info(`Started consuming messages from ${queueName}`);
  }

  /**
   * Close the RabbitMQ connection
   */
  async close(intentional: boolean = false): Promise<void> {
    try {
      if (this?.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this?.channelModel) {
        if (intentional) {
          this.logService.info("RabbitMQ connection closed intentionally");
        } else {
          this.logService.error("RabbitMQ connection closed, attempting to reconnect...");
          setTimeout(() => this.initialize(), 5000);
        }
        await this.channelModel.close();
        this.channelModel = null;
      }
    } catch (error) {
      this.logService.error(
        `Error closing RabbitMQ connections: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Send a message to the specified queue
   */
  private async sendMessage(queueName: string, message: QueueMessage): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    if (!this.channel) {
      throw new Error("Failed to initialize RabbitMQ channel");
    }

    try {
      this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      this.logService.info(`Sent message to ${queueName}: ${message.id}`);
    } catch (error) {
      this.logService.error(
        `Failed to send message to ${queueName}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  /**
    async onJobComplete(jobId: string): Promise<void> {
      const videoJob = await this.jobRepository.getJobWaitingOnDependency(jobId, JobType.VIDEO);
      if (!videoJob) return;
  
      const deps = videoJob.dependsOn || [];
      const statuses = await this.jobRepository.getJobStatuses(deps);
      const allDone = statuses.every((status: JobStatus) =>
        status === JobStatus.DONE || status === JobStatus.SKIPPED
      );
  
      if (allDone) {
        if (videoJob.type === 'VIDEO') {
          await this.sendVideoGenerateMessage({
            taskId: videoJob.taskId,
            storyId: videoJob.storyId
          });
  
          await this.jobRepository.update(videoJob.taskId, {
            status: JobStatus.IN_PROGRESS,
            metadata: {
              ...(videoJob.metadata as Record<string, any>),
            }
          });
        }
      }
    }
       */
}
