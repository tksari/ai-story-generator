import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { PageRepository } from "@/domain/story/page/page.repository";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { PageService } from "@/domain/story/page/page.service";
import {
  createPageSchema,
  updatePageOrderSchema,
  updatePageSchema,
} from "@/domain/story/page/page.schema";
import { JobService } from "@/domain/job/job.service";
import { JobType } from "@prisma/client";

@injectable()
export class PageController extends BaseController {
  constructor(
    @inject("PageRepository") private pageRepository: PageRepository,
    @inject("PageService") private pageService: PageService,
    @inject("JobService") private jobService: JobService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/pages/:id", this.get);
    this.route("post", "/stories/:storyId/pages", this.create);
    this.route("put", "/pages/:id", this.update);
    this.route("delete", "/pages/:id", this.delete);
    this.route("delete", "/stories/:storyId/pages", this.deletePagesByStoryId);
    this.route("get", "/stories/:storyId/pages", this.getPagesByStoryId);
    this.route("put", "/pages/:pageId/order", this.updatePageOrder);
    this.route("post", "/stories/:id/pages/generate", this.generatePagesForStory);
  }

  private async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) throw new HttpError(400, "Invalid page ID");

      const page = await this.pageRepository.findById(id);

      if (!page) throw new HttpError(404, "Page not found");

      res.status(200).json({ data: { page } });
    } catch (error) {
      next(error);
    }
  }

  private async getPagesByStoryId(req: Request, res: Response, next: NextFunction) {
    try {
      const storyId = parseInt(req.params.storyId);
      if (isNaN(storyId)) throw new HttpError(400, "Invalid story ID");

      const pages = await this.pageRepository.getStoryPagesWithMedia(storyId);

      res.status(200).json({ data: { pages } });
    } catch (error) {
      next(error);
    }
  }

  private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storyId = parseInt(req.params.storyId);
      if (isNaN(storyId)) throw new HttpError(400, "Invalid story ID");

      const page = await this.pageService.createPage(storyId, req.body);

      res.status(201).json({ data: { page } });
    } catch (error) {
      next(error);
    }
  }

  private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new HttpError(400, "Invalid page ID");

      const page = await this.pageService.updatePage(id, req.body);

      res.status(200).json({ data: { page } });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new HttpError(400, "Invalid page ID");

      await this.pageService.deletePage(id);

      res.status(200).json();
    } catch (error) {
      next(error);
    }
  }

  private async deletePagesByStoryId(req: Request, res: Response, next: NextFunction) {
    try {
      const storyId = parseInt(req.params.storyId);
      if (isNaN(storyId)) throw new HttpError(400, "Invalid story ID");

      await this.pageRepository.deletePagesByStoryId(storyId);

      res.status(200).json();
    } catch (error) {
      next(error);
    }
  }

  private async updatePageOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pageId = parseInt(req.params.pageId);

      if (isNaN(pageId)) throw new HttpError(400, "Invalid page ID");

      await this.pageService.updatePageOrder(pageId, req.body);

      res.status(200).json();
    } catch (error) {
      next(error);
    }
  }

  private async generatePagesForStory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { pageCount = 1, isEndStory = false } = req.body;

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid story ID");
      }

      await this.pageService.generatePagesForStory(id, pageCount, isEndStory);

      return res.status(202).json({ message: "Pages generation job queued." });
    } catch (error) {
      next(error);
    }
  }
}
