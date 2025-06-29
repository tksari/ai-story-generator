import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { StoryService } from "@/domain/story/story.service";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { JobService } from "@/domain/job/job.service";
import { JobType } from "@prisma/client";
import { createStorySchema, updateStorySchema } from "./story.schema";

@injectable()
export class StoryController extends BaseController {
  constructor(
    @inject("StoryService") private storyService: StoryService,
    @inject("JobService") private jobService: JobService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/stories", this.index);
    this.route("get", "/stories/:id", this.get);
    this.route("post", "/stories", this.create);
    this.route("put", "/stories/:id", this.update);
    this.route("delete", "/stories/:id", this.delete);
  }

  private async index(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const query = req.query.query as string;

      const result = query
        ? await this.storyService.searchStories(query, page, pageSize)
        : await this.storyService.getStories(page, pageSize);

      res.status(200).json({
        data: {
          stories: result.stories,
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

  private async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid story ID");
      }

      const story = await this.storyService.getStoryWithPages(id);

      if (!story) {
        throw new HttpError(404, `Story not found with ID: ${id}`);
      }

      res.status(200).json({
        data: { story },
      });
    } catch (error) {
      next(error);
    }
  }

  private async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createStorySchema.parse(req.body);
      const story = await this.storyService.create(data);
      res.status(201).json({
        data: { story },
      });
    } catch (error) {
      next(error);
    }
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid story ID");
      }

      await this.jobService.assertNoActiveJob(id, [JobType.PAGE, JobType.VIDEO]);

      const data = updateStorySchema.parse(req.body);
      const story = await this.storyService.update(id, data);

      res.status(200).json({
        data: { ...story },
      });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid story ID");
      }

      await this.jobService.assertNoActiveJob(id, [JobType.PAGE, JobType.VIDEO]);

      await this.storyService.delete(id);

      res.status(200).json({
        message: `Story with ID ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}
