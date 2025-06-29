import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "@/core/common/base.controller";
import { GeneratedVideoService } from "@/domain/story/page/generated-video/generated-video.service";
import { HttpError } from "@/middleware/error-handler";
import { JobType } from "@prisma/client";
import { JobService } from "@/domain/job/job.service";

@injectable()
export class GeneratedVideoController extends BaseController {
  constructor(
    @inject("GeneratedVideoService")
    private generatedVideoService: GeneratedVideoService,
    @inject("JobService") private jobService: JobService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("delete", "/generated-videos/:id", this.delete);
    this.route("post", "/generated-videos/generate", this.generateVideo);
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid video ID");
      }

      await this.generatedVideoService.deleteVideo(id);

      res.status(200).json();
    } catch (error) {
      next(error);
    }
  }

  private async generateVideo(req: Request, res: Response): Promise<void> {
    const video = await this.generatedVideoService.queueVideoGeneration(req.body);

    res.status(200).json({
      data: { video },
    });
  }
}
