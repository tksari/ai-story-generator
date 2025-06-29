import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { CapabilityService } from "@/domain/providers/capability/capability.service";
import { createCapabilitySchema, updateCapabilitySchema } from "@/types/capability.types";

@injectable()
export class CapabilityController extends BaseController {
  constructor(@inject("CapabilityService") private capabilityService: CapabilityService) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("put", "/capabilities/:id", this.update);
    this.route("delete", "/capabilities/:id", this.delete);
    this.route("get", "/providers/:providerId/capabilities", this.index);
    this.route("post", "/providers/:providerId/capabilities", this.create);
  }

  private async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        throw new HttpError(400, "Invalid provider ID");
      }

      const capabilities = await this.capabilityService.getCapabilitiesByProviderId(providerId);

      res.status(200).json({
        data: { capabilities },
      });
    } catch (error) {
      next(error);
    }
  }

  private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        throw new HttpError(400, "Invalid provider ID");
      }

      const data = createCapabilitySchema.parse(req.body);
      const provider = await this.capabilityService.create(providerId, data);

      res.status(201).json({
        data: { provider },
      });
    } catch (error) {
      next(error);
    }
  }

  private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid capability ID");
      }

      const data = updateCapabilitySchema.parse(req.body);
      const provider = await this.capabilityService.update(id, data);

      res.status(200).json({
        data: { provider },
      });
    } catch (error) {
      next(error);
    }
  }

  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new HttpError(400, "Invalid capability ID");
      }

      await this.capabilityService.delete(id);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  }
}
