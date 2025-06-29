import { inject, injectable } from "tsyringe";
import { RedisService } from "./redis.service";

@injectable()
export class CacheService {
  private readonly PREFIX = "cache:";

  constructor(@inject("RedisService") private redisService: RedisService) {}

  private getKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.redisService.getClient();
      const value = await client.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const client = this.redisService.getClient();
      await client.set(this.getKey(key), JSON.stringify(value), "EX", ttlSeconds);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.redisService.getClient();
      await client.del(this.getKey(key));
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      const client = this.redisService.getClient();
      const keys = await client.keys(`${this.PREFIX}*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const client = this.redisService.getClient();
      const keys = await client.keys(`${this.PREFIX}${pattern}`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidateByPattern error:", error);
    }
  }
}
