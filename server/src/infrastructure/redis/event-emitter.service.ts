import { inject, injectable } from "tsyringe";
import { RedisService } from "@/infrastructure/redis/redis.service";
import { LogService } from "@/infrastructure/logging/log.service";

@injectable()
export class EventEmitterService {
  private readonly REDIS_CHANNEL = "socket";

  constructor(
    @inject("RedisService") private redisService: RedisService,
    @inject("LogService") private logService: LogService
  ) {}

  /**
   * Emit an event to Redis channel
   * @param channel Channel name (e.g. 'story:1', 'image:1')
   * @param eventName Socket.IO event name (e.g. 'started', 'updated')
   * @param payload Event payload
   */
  async emit(channel: string, eventName: string, payload: any): Promise<void> {
    try {
      const redisClient = this.redisService.getClient();
      await redisClient.publish(this.REDIS_CHANNEL, JSON.stringify([channel, eventName, payload]));
      this.logService.debug(`Emitted ${eventName} event to ${channel}`);
    } catch (error) {
      this.logService.error(`Failed to emit ${eventName} event to ${channel}:`, error);
      throw error;
    }
  }
}
