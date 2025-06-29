import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { z } from "zod";
import { GeneratedImageRepository } from "@/domain/story/page/generated-image/generated-image.repository";
import { HttpError } from "@/middleware/error-handler";
import { GeneratedImageService } from "@/domain/story/page/generated-image/generated-image.service";
import { BaseController } from "@/core/common/base.controller";

@injectable()
export class GeneratedImageController extends BaseController {
  constructor(
    @inject("GeneratedImageRepository")
    private imageRepository: GeneratedImageRepository,
    @inject("GeneratedImageService")
    private generatedImageService: GeneratedImageService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("post", "/generated-images/:imageId/default", this.setDefault);
    this.route("delete", "/generated-images/:imageId", this.delete);
    this.route("post", "/generated-images/generate", this.generateImage);
    this.route("post", "/generated-images/generate-bulk", this.generateBulkImage);
  }

  private async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imageId = parseInt(req.params.imageId);

      if (isNaN(imageId)) throw new HttpError(400, "Invalid image ID");

      const defaultImage = await this.generatedImageService.setDefault(imageId);

      res.status(200).json({
        data: defaultImage,
      });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imageId = parseInt(req.params.imageId);
      if (isNaN(imageId)) throw new HttpError(400, "Invalid image ID");
      await this.generatedImageService.deleteImage(imageId);

      res.status(200).json();
    } catch (error) {
      next(error);
    }
  }

  private async generateImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pageId } = z
        .object({
          pageId: z.number().int().positive(),
        })
        .parse(req.body);

      const data = await this.generatedImageService.generateImageForSinglePage(pageId);

      res.status(201).json({
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  private async generateBulkImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storyId } = z.object({ storyId: z.number().int().positive() }).parse(req.body);

      const generatedImages = await this.generatedImageService.generateImageForAllPages(storyId);

      res.status(201).json({
        data: {
          images: generatedImages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
