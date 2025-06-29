import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "@/core/common/base.controller";
import { DashboardService } from "@/domain/dashboard/dashboard.service";

@injectable()
export class DashboardController extends BaseController {
  constructor(@inject("DashboardService") private dashboardService: DashboardService) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/dashboard/stats", this.getStats);
  }

  private async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.dashboardService.getStats();
      res.status(200).json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
}
