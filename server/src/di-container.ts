import "reflect-metadata";
import { container } from "tsyringe";
import { prisma } from "@/infrastructure/prisma/prisma";
import { ConfigService } from "./config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { RedisService } from "@/infrastructure/redis/redis.service";
import { registerAll } from "./utils/register-all";
import { ProviderInstanceResolver } from "./providers/ProviderInstanceResolver";
import { CacheService } from "@/infrastructure/redis/cache.service";
import { QueueService } from "@/infrastructure/queue/queue.service";

container.registerSingleton("ConfigService", ConfigService);
container.registerSingleton("LogService", LogService);
container.registerSingleton("RedisService", RedisService);
container.registerSingleton("QueueService", QueueService);
container.registerSingleton("ProviderInstanceResolver", ProviderInstanceResolver);
container.registerInstance("PrismaClient", prisma);
container.register("CacheService", {
  useClass: CacheService,
});

export async function initializeContainer() {
  await registerAll("**/*.repository");
  await registerAll("**/*.service");
  await registerAll("**/*.factory");
  await registerAll("**/providers/*.provider");
}

export { container };
