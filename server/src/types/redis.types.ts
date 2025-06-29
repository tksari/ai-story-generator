import { Redis } from "ioredis";

export interface IRedisService {
  getClient(): Redis;
  getPubClient(): Redis;
  getSubClient(): Redis;
  isConnected(): boolean;
  close(): Promise<void>;
}

export interface IRedisConfig {
  url: string;
  password?: string;
  db?: number;
}
