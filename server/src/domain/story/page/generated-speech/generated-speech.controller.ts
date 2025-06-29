import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { z } from "zod";
import { HttpError } from "@/middleware/error-handler";
import { GeneratedSpeechRepository } from "@/domain/story/page/generated-speech/generated-speech.repository";
import { GeneratedSpeechService } from "@/domain/story/page/generated-speech/generated-speech.service";
import { BaseController } from "@/core/common/base.controller";

@injectable()
export class GeneratedSpeechController extends BaseController {
  constructor(
    @inject("GeneratedSpeechRepository")
    private speechRepository: GeneratedSpeechRepository,
    @inject("GeneratedSpeechService")
    private speechService: GeneratedSpeechService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/generated-speeches/:id", this.get);
    this.route("post", "/generated-speeches/:id/default", this.setDefault);
    this.route("delete", "/generated-speeches/:id", this.delete);
    this.route("post", "/generated-speeches/generate", this.generateSpeech);
    this.route("post", "/generated-speeches/generate-bulk", this.generateBulkSpeech);
  }

  private async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) throw new HttpError(400, "Invalid speech ID");

      const speech = await this.speechRepository.findById(id);

      if (!speech) {
        throw new HttpError(404, "Speech not found");
      }

      res.status(200).json({ speech });
    } catch (error) {
      next(error);
    }
  }

  private async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new HttpError(400, "Invalid speech ID");

      const speech = await this.speechService.setDefaultSpeech(id);

      res.status(200).json({ data: speech });
    } catch (error) {
      next(error);
    }
  }

  private async generateSpeech(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pageId } = z.object({ pageId: z.number().int().positive() }).parse(req.body);

      if (isNaN(pageId)) throw new HttpError(400, "Invalid page ID");

      const GeneratedSpeech = await this.speechService.generateSpeechForSinglePage(pageId);

      res.status(200).json({ data: { ...GeneratedSpeech } });
    } catch (error) {
      next(error);
    }
  }

  private async generateBulkSpeech(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storyId } = z.object({ storyId: z.number().int().positive() }).parse(req.body);
      if (isNaN(storyId)) throw new HttpError(400, "Invalid story ID");

      const generatedSpeeches = await this.speechService.generateSpeechForAllPages(storyId);

      res.status(200).json({ data: generatedSpeeches });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new HttpError(400, "Invalid speech ID");

      await this.speechService.deleteSpeech(id);

      res.status(200).json({ message: "Speech deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
