import { inject, injectable } from "tsyringe";
import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { ConfigService } from "@/config/config.service.js";
import { LogService } from "@/infrastructure/logging/log.service";
import { RedisService } from "@/infrastructure/redis/redis.service";

@injectable()
export class SocketService {
  private io: SocketServer | null = null;
  private isInitialized = false;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService,
    @inject("RedisService") private redisService: RedisService
  ) {}

  /**
   * Initialize Socket.IO server with Redis adapter
   */
  async initialize(server?: HttpServer): Promise<void> {
    if (this.isInitialized) {
      this.logService.info("Socket.IO server already initialized");
      return;
    }

    try {
      if (!this.redisService.isConnected()) {
        throw new Error("Redis service must be initialized before Socket.IO");
      }

      if (server) {
        this.io = new SocketServer(server, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"],
          },
          transports: ["websocket", "polling"],
        });
        this.logService.info("Socket.IO server initialized in API mode");
      } else {
        this.io = new SocketServer({
          cors: {
            origin: "*",
            methods: ["GET", "POST"],
          },
          transports: ["websocket", "polling"],
        });
        this.logService.info("Socket.IO server initialized in worker mode");
      }

      if (this.io) {
        this.io.adapter(
          createAdapter(this.redisService.getPubClient(), this.redisService.getSubClient())
        );
        this.logService.info("Socket.IO Redis adapter configured");
      }

      if (server) {
        this.setupEventHandlers();
      }

      this.isInitialized = true;
      this.logService.info("Socket.IO server initialization completed");
    } catch (error) {
      this.logService.error("Failed to initialize Socket.IO server", error);
      await this.close();
      throw error;
    }
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      const clientId = socket.id;
      this.logService.info(`Client connected: ${clientId}`);

      socket.on("join", (channel: string, id: number) => {
        const room = `${channel}:${id}`;
        socket.join(room);
        this.logService.info(`Client ${clientId} joined ${room}`);
      });

      socket.on("leave", (channel: string, id: number) => {
        const room = `${channel}:${id}`;
        socket.leave(room);
        this.logService.info(`Client ${clientId} left ${room}`);
      });

      socket.on("disconnect", () => {
        this.logService.info(`Client disconnected: ${clientId}`);
      });
    });
  }

  /**
   * Emit an event to a specific channel
   */
  emit(channel: string, eventName: string, data: any): void {
    if (!this.isInitialized || !this.io) {
      this.logService.warn(`Socket.IO not initialized, can't emit ${eventName} to ${channel}`);
      return;
    }

    try {
      this.io.to(channel).emit(eventName, data);
      this.logService.debug(`Emitted ${eventName} to ${channel}`);
    } catch (error) {
      this.logService.error(`Failed to emit ${eventName} to ${channel}`, error);
    }
  }

  /**
   * Check if Socket.IO server is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.io !== null && this.redisService.isConnected();
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.io) {
        this.io.close();
        this.io = null;
      }
      this.isInitialized = false;
      this.logService.info("Socket.IO server closed");
    } catch (error) {
      this.logService.error("Error while closing Socket.IO server", error);
      throw error;
    }
  }
}
