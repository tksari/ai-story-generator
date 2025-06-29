import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { z } from "zod";
import { VideoLayoutService } from "@/domain/layout/video-layout.service";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";

const layoutSchema = z.object({
  name: z.string().min(1).max(255),
  items: z.array(z.any()),
});

@injectable()
export class VideoLayoutController extends BaseController {
  constructor(@inject("VideoLayoutService") private layoutService: VideoLayoutService) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/video-layouts/:id", this.get);
    this.route("post", "/video-layouts", this.create);
    this.route("put", "/video-layouts/:id", this.update);
    this.route("delete", "/video-layouts/:id", this.delete);
    this.route("get", "/video-layouts", this.list);
    this.route("get", "/video-layouts/load", this.loadDefault);
  }

  private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = layoutSchema.parse(req.body);
      const result = await this.layoutService.saveLayout(data);

      res.status(201).json({
        data: { layout: result },
      });
    } catch (error) {
      next(error);
    }
  }

  private async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const layout = await this.layoutService.getLayout(id);

      if (!layout) {
        throw new HttpError(404, `Layout not found with ID: ${id}`);
      }

      res.status(200).json({
        data: { layout },
      });
    } catch (error) {
      next(error);
    }
  }

  private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = layoutSchema.parse(req.body);
      const layout = await this.layoutService.updateLayout(id, data);

      res.status(200).json({
        data: { layout },
      });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.layoutService.deleteLayout(id);

      res.status(200).json({
        message: `Layout with ID ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  private async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const layouts = await this.layoutService.listLayouts();

      res.status(200).json({
        data: { layouts },
      });
    } catch (error) {
      next(error);
    }
  }

  private async loadDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const layout = await this.layoutService.getDefaultLayout();

      if (!layout) {
        throw new HttpError(404, "Default layout not found");
      }

      res.status(200).json({
        data: { layout },
      });
    } catch (error) {
      next(error);
    }
  }
}
