import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { VoiceRepository } from "@/domain/providers/voice/voice.repository";
import { VoiceService } from "@/domain/providers/voice/voice.service";
import { createVoiceSchema, updateVoiceSchema } from "@/types/voice.types";
import z from "zod";

@injectable()
export class VoiceController extends BaseController {
  constructor(
    @inject("VoiceRepository") private voiceRepository: VoiceRepository,
    @inject("VoiceService") private voiceService: VoiceService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/voices/:id", this.getById);
    this.route("put", "/voices/:id", this.update);
    this.route("delete", "/voices/:id", this.delete);
    this.route("patch", "/voices/:id/set-default", this.setDefault);
    this.route("get", "/providers/:providerId/voices", this.index);
    this.route("post", "/providers/:providerId/voices", this.bulkCreate);
  }

  private async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        throw new HttpError(400, "Invalid provider ID");
      }

      const includeInactive = req.query.includeInactive === "true";
      const voices = await this.voiceService.getVoicesByProviderId(providerId, includeInactive);
      res.status(200).json({
        data: { voices },
      });
    } catch (error) {
      next(error);
    }
  }

  private async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid voice ID");
      }

      const voice = await this.voiceRepository.findById(id);

      res.status(200).json({
        data: { voice },
      });
    } catch (error) {
      next(error);
    }
  }

  private async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);

      if (isNaN(providerId)) {
        throw new HttpError(400, "Invalid provider ID");
      }

      if (Array.isArray(req.body)) {
        const voices = z.array(createVoiceSchema).parse(req.body);
        await this.voiceService.bulkCreateVoices(providerId, voices);
      } else {
        throw new HttpError(400, "Invalid request body");
      }

      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }

  private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid voice ID");
      }
      const data = updateVoiceSchema.parse(req.body);
      const voice = await this.voiceService.update(id, data);

      res.status(200).json({
        data: { voice },
      });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid voice ID");
      }

      const existingVoice = await this.voiceRepository.findById(id);
      if (!existingVoice) {
        throw new HttpError(404, `Voice not found with ID: ${id}`);
      }

      await this.voiceRepository.deleteById(id);
      res.status(200).json({
        message: `Voice with ID ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  private async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid voice ID");
      }

      const existingVoice = await this.voiceRepository.findById(id);
      if (!existingVoice) {
        throw new HttpError(404, `Voice not found with ID: ${id}`);
      }

      const voice = await this.voiceService.setDefaultVoice(id);
      res.status(200).json({
        data: { voice },
      });
    } catch (error) {
      next(error);
    }
  }
}
