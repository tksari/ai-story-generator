import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { ProviderService } from "@/domain/providers/provider.service";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import { HttpError } from "@/middleware/error-handler";
import { BaseController } from "@/core/common/base.controller";
import { createProviderSchema, updateProviderSchema } from "@/types/provider.types";

@injectable()
export class ProviderController extends BaseController {
  constructor(
    @inject("ProviderService") private providerService: ProviderService,
    @inject("ProviderRepository")
    private providerRepository: ProviderRepository
  ) {
    super();
  }

  protected initializeRoutes(): void {
    this.route("get", "/providers", this.index);
    this.route("post", "/providers", this.create);
    this.route("get", "/providers/:id", this.get);
    this.route("put", "/providers/:id", this.update);
    this.route("delete", "/providers/:id", this.delete);
  }

  private async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const providers = await this.providerRepository.getAll(includeInactive);
      res.status(200).json({
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }
  private async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new HttpError(400, "Invalid provider ID");
      }

      const provider = await this.providerRepository.findById(id);

      res.status(200).json({
        data: { provider },
      });
    } catch (error) {
      next(error);
    }
  }
  private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createProviderSchema.parse(req.body);
      const provider = await this.providerService.create(data);
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
        throw new HttpError(400, "Invalid provider ID");
      }

      const data = updateProviderSchema.parse(req.body);
      const provider = await this.providerService.update(id, data);

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
        throw new HttpError(400, "Invalid provider ID");
      }

      await this.providerService.delete(id);

      res.status(200);
    } catch (error) {
      next(error);
    }
  }
}
