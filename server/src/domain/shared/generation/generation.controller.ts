import { injectable } from "tsyringe";
import { BaseController } from "@/core/common/base.controller";
import { NextFunction, Request, Response } from "express";
import { defaultGenerationSettings } from "@/domain/shared/generation/default-generation-settings";
import { generationOptions } from "@/domain/shared/generation/generation-options";

@injectable()
export class OptionsController extends BaseController {
  protected initializeRoutes(): void {
    this.route("get", "/options/story", this.getStoryGenerationOptions);
  }

  private async getStoryGenerationOptions(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        data: {
          settings: {
            ...defaultGenerationSettings,
          },
          generation_options: {
            ...generationOptions,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
