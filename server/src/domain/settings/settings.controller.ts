import { injectable, inject } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { BaseController } from "@/core/common/base.controller";
import { SettingsService } from "@/domain/settings/settings.service";
import { updateSettingsSchema } from "@/domain/settings/settings.schema";

@injectable()
export class SettingsController extends BaseController {
  constructor(@inject("SettingsService") private settingsService: SettingsService) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/settings", this.getSettings);
    this.route("put", "/settings", this.updateSettings);
  }

  private async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      res.status(200).json({
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  private async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const settings = await this.settingsService.updateSettings(validatedData);

      res.status(200).json({
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
}
