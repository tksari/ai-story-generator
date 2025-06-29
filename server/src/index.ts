import "reflect-metadata";
import express, { Express } from "express";
import http from "http";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { container } from "tsyringe";

import { ConfigService } from "./config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { RedisService } from "@/infrastructure/redis/redis.service";
import { SocketService } from "@/infrastructure/socket/socket.service";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { SocketBridgeService } from "@/infrastructure/socket/socket-bridge.service";

import {
  responseCaptureMiddleware,
  requestLogMiddleware,
} from "@/middleware/request-log.middleware";
import { errorHandler } from "@/middleware/error-handler";
import { registerRoutes } from "@/routes/index";

export class App {
  private app: Express;
  private server: http.Server;
  private readonly config: ConfigService;
  private readonly log: LogService;
  private readonly redis: RedisService;
  private readonly queue: QueueService;
  private readonly socket: SocketService;
  private readonly socketBridge: SocketBridgeService;
  private readonly storage: StorageService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    this.config = container.resolve("ConfigService");
    this.log = container.resolve("LogService");
    this.redis = container.resolve("RedisService");
    this.queue = container.resolve("QueueService");
    this.socket = container.resolve("SocketService");
    this.socketBridge = container.resolve("SocketBridgeService");
    this.storage = container.resolve("StorageService");
  }

  public async initialize() {
    this.configureMiddlewares();
    await this.initializeServices();
    await registerRoutes(this.app);
    this.handleErrors();
    this.handleGracefulShutdown();
  }

  public start() {
    const PORT = this.config.get("PORT") || 3000;
    this.server.listen(PORT, () => {
      this.log.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  }

  private configureMiddlewares() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(responseCaptureMiddleware);
    this.app.use(requestLogMiddleware);
    this.app.use("/uploads", express.static("uploads"));

    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Cross-Origin-Resource-Policy", "cross-origin");
      res.header("Cross-Origin-Embedder-Policy", "credentialless");
      res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      if (req.method === "OPTIONS") return res.status(200).end();
      next();
    });
  }

  private async initializeServices() {
    await this.redis.initialize();
    this.log.info("Redis initialized");

    await this.socket.initialize(this.server);
    this.log.info("Socket.IO initialized");

    await this.socketBridge.initialize();
    this.log.info("Socket bridge initialized");

    await this.queue.initialize();
    this.log.info("RabbitMQ initialized");

    await this.storage.ensureDirectoriesExist();
    this.log.info("Storage directories ensured");
  }

  private handleErrors() {
    this.app.use(errorHandler);
  }

  private handleGracefulShutdown() {
    const shutdown = async (signal: string) => {
      this.log.info(`${signal} signal received. Closing server...`);
      this.server.close(async () => {
        this.log.info("HTTP server closed.");

        try {
          await this.redis.close();
          this.log.info("Redis connection closed.");

          await this.queue.close();
          this.log.info("RabbitMQ connection closed.");

          process.exit(0);
        } catch (error) {
          this.log.error(
            `Error during shutdown: ${error instanceof Error ? error.message : String(error)}`
          );
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
