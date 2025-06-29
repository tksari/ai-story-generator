import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "@/core/common/base.controller";
import { RequestLogService } from "@/domain/request-log/request-log.service";

@injectable()
export class RequestLogController extends BaseController {
  constructor(@inject("RequestLogService") private requestLogService: RequestLogService) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/request-logs", this.index);
    this.route("get", "/request-logs/:id", this.get);
  }

  private async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await this.requestLogService.getLogs(page, pageSize);

      res.status(200).json({
        data: {
          logs: result.logs,
          pagination: {
            page,
            pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / pageSize),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const log = await this.requestLogService.getById(id);

      if (!log) {
        res.status(404).json({ message: "Request log not found" });
        return;
      }

      res.status(200).json({ data: log });
    } catch (error) {
      next(error);
    }
  }
}
