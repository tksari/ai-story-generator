import { inject, injectable } from "tsyringe";
import { Redis } from "ioredis";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { IRedisService } from "@/types/redis.types";

@injectable()
export class RedisService implements IRedisService {
  private client: Redis | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private isInitialized = false;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService
  ) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logService.info("Redis service already initialized");
      return;
    }

    try {
      const host = this.configService.get("REDIS_HOST") || "localhost";
      const port = this.configService.get("REDIS_PORT") || "6379";
      const password = this.configService.get("REDIS_PASSWORD");
      const db = parseInt(this.configService.get("REDIS_DB") || "0");

      const redisConnectionUrl = `redis://${host}:${port}`;

      this.logService.info(`Connecting to Redis at ${redisConnectionUrl}`);

      this.client = new Redis(redisConnectionUrl, {
        password: password,
        db: db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.pubClient = this.client.duplicate();
      this.subClient = this.client.duplicate();

      this.setupEventHandlers();

      await Promise.all([
        new Promise<void>((resolve) => {
          if (this.client?.status === "ready") resolve();
          else this.client?.once("ready", () => resolve());
        }),
        new Promise<void>((resolve) => {
          if (this.pubClient?.status === "ready") resolve();
          else this.pubClient?.once("ready", () => resolve());
        }),
        new Promise<void>((resolve) => {
          if (this.subClient?.status === "ready") resolve();
          else this.subClient?.once("ready", () => resolve());
        }),
      ]);

      this.isInitialized = true;
      this.logService.info("Redis service initialized successfully");
    } catch (error) {
      this.logService.error("Failed to initialize Redis service", error);
      await this.close();
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client || !this.pubClient || !this.subClient) return;

    const setupClientEvents = (client: Redis, name: string) => {
      client.on("connect", () => this.logService.info(`Redis ${name} connected`));
      client.on("ready", () => this.logService.info(`Redis ${name} ready`));
      client.on("error", (err: any) => this.logService.error(`Redis ${name} error`, err));
      client.on("close", () => this.logService.info(`Redis ${name} connection closed`));
      client.on("reconnecting", () => this.logService.info(`Redis ${name} reconnecting`));
    };

    setupClientEvents(this.client, "main");
    setupClientEvents(this.pubClient, "pub");
    setupClientEvents(this.subClient, "sub");
  }

  getClient(): Redis {
    if (!this.isInitialized || !this.client) {
      throw new Error("Redis service not initialized");
    }
    return this.client;
  }

  getPubClient(): Redis {
    if (!this.isInitialized || !this.pubClient) {
      throw new Error("Redis pub client not initialized");
    }
    return this.pubClient;
  }

  getSubClient(): Redis {
    if (!this.isInitialized || !this.subClient) {
      throw new Error("Redis sub client not initialized");
    }
    return this.subClient;
  }

  isConnected(): boolean {
    return (
      this.isInitialized &&
      this.client?.status === "ready" &&
      this.pubClient?.status === "ready" &&
      this.subClient?.status === "ready"
    );
  }

  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }
      if (this.pubClient) {
        await this.pubClient.quit();
        this.pubClient = null;
      }
      if (this.subClient) {
        await this.subClient.quit();
        this.subClient = null;
      }
      this.isInitialized = false;
      this.logService.info("Redis service closed");
    } catch (error) {
      this.logService.error("Error while closing Redis service", error);
      throw error;
    }
  }
}
