import { inject, injectable } from "tsyringe";
import { RedisService } from "@/infrastructure/redis/redis.service";
import { SocketService } from "@/infrastructure/socket/socket.service";
import { LogService } from "@/infrastructure/logging/log.service";

@injectable()
export class SocketBridgeService {
  private isInitialized = false;
  private readonly REDIS_CHANNEL = "socket";

  constructor(
    @inject("RedisService") private redisService: RedisService,
    @inject("SocketService") private socketService: SocketService,
    @inject("LogService") private logService: LogService
  ) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logService.info("Socket bridge already initialized");
      return;
    }

    try {
      if (!this.socketService.isReady()) {
        throw new Error("Socket.IO service must be initialized before Socket Bridge");
      }

      const subClient = this.redisService.getSubClient();

      await subClient.subscribe(this.REDIS_CHANNEL);
      this.logService.info(`Subscribed to Redis channel: ${this.REDIS_CHANNEL}`);

      subClient.on("message", (channel: string, message: string) => {
        try {
          const [targetChannel, eventName, payload] = JSON.parse(message);
          this.socketService.emit(targetChannel, eventName, payload);
          this.logService.debug(`Forwarded ${eventName} event to ${targetChannel}`);
        } catch (error) {
          this.logService.error(`Error processing Redis message:`, error);
        }
      });

      this.isInitialized = true;
      this.logService.info("Socket bridge initialized");
    } catch (error) {
      this.logService.error("Failed to initialize socket bridge", error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.socketService.isReady();
  }
}
