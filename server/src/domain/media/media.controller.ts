import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { LogService } from "@/infrastructure/logging/log.service";
import path from "path";
import { getContentType } from "@/utils/index";
import { BaseController } from "@/core/common/base.controller";

@injectable()
export class MediaController extends BaseController {
  constructor(
    @inject("StorageService") private storageService: StorageService,
    @inject("LogService") private logService: LogService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/media/*", this.get);
    this.route("delete", "/media/*", this.delete);
  }

  private async get(req: Request & { params: { [key: string]: string } }, res: Response) {
    try {
      const filePath = req.params[0];

      if (!filePath) {
        return res.status(400).end();
      }

      const fileExists = await this.storageService.fileExists(filePath);

      if (!fileExists) {
        return res.status(404).end();
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = getContentType(ext);

      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.setHeader("Content-Type", contentType);

      const fileStream = await this.storageService.readFileAsStream(filePath);

      fileStream.on("error", (error) => {
        this.logService.error(`Error streaming file ${filePath}:`, error);
        if (!res.headersSent) {
          return res.status(500).end();
        }
      });

      fileStream.pipe(res);
    } catch (error) {
      this.logService.error("Error in getMedia:", error);
      if (!res.headersSent) {
        return res.status(500).end();
      }
    }
  }

  private async delete(req: Request & { params: { [key: string]: string } }, res: Response) {
    try {
      const filePath = req.params[0];

      if (!filePath) {
        return res.status(400).end();
      }

      const fileExists = await this.storageService.fileExists(filePath);

      if (!fileExists) {
        return res.status(404).end();
      }

      await this.storageService.deleteFileIfExists(filePath);

      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
}
