import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { JobType } from "@prisma/client";
import { JobService } from "@/domain/job/job.service";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { JobRepository } from "@/domain/job/job.repository";

@injectable()
export class QueueController extends BaseController {
  constructor(
    @inject("JobService") private jobService: JobService,
    @inject("JobRepository") private jobRepository: JobRepository
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/jobs", this.index);
    this.route("get", "/jobs/active", this.getJobByStoryIdAndType);
    this.route("get", "/jobs/:taskId", this.get);
    this.route("delete", "/jobs/:taskId", this.delete);
    this.route("delete", "/jobs/stories/:storyId", this.deleteJobsByStoryId);
  }

  private async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await this.jobService.getJobs(page, pageSize);

      res.status(200).json({
        data: {
          jobs: result.jobs,
          pagination: {
            total: result.total,
            page,
            pageSize,
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
      const { taskId } = req.params;
      const job = await this.jobService.getJobByTaskId(taskId);

      if (!job) {
        throw new HttpError(404, `Job not found with task ID: ${taskId}`);
      }

      res.status(200).json({
        data: { job },
      });
    } catch (error) {
      next(error);
    }
  }

  private async getJobByStoryIdAndType(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storyId = parseInt(req.query.storyId as string);
      const type = req.query.type as JobType;

      if (isNaN(storyId) || !type) {
        throw new HttpError(400, "Invalid or missing storyId/type");
      }

      const job = await this.jobRepository.findAnyActiveJobByStoryIdAndTypes(storyId, [type]);

      res.status(200).json({ data: job });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      await this.jobService.deleteJob(taskId);

      res.status(200).json({
        message: `Job with task ID ${taskId} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  private async deleteJobsByStoryId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storyId = parseInt(req.params.storyId);

      if (isNaN(storyId)) {
        throw new HttpError(400, "Invalid story ID");
      }

      const count = await this.jobService.deleteJobsByStoryId(storyId);

      res.status(200).json({
        message: `${count} jobs deleted for story ID: ${storyId}`,
      });
    } catch (error) {
      next(error);
    }
  }
}
