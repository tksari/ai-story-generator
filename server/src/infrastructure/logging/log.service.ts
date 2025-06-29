import { inject, injectable } from "tsyringe";
import winston from "winston";
import { ConfigService } from "@/config/config.service";

@injectable()
export class LogService {
  private logger: winston.Logger;

  constructor(@inject("ConfigService") private configService: ConfigService) {
    const environment = this.configService.get("NODE_ENV") || "development";
    const logLevel = environment === "production" ? "info" : "debug";

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: "ai-content-backend" },
      transports: [
        ...(environment === "production" || environment === "development"
          ? [
              new winston.transports.File({
                filename: "logs/error.log",
                level: "error",
              }),
              new winston.transports.File({ filename: "logs/combined.log" }),
            ]
          : []),
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    if (environment === "production") {
      const fs = require("fs");
      if (!fs.existsSync("logs")) {
        fs.mkdirSync("logs");
      }
    }
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Get the Winston logger instance
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}
