import "reflect-metadata";
import { container } from "@/di-container";
import { Router, RequestHandler, Request, Response, NextFunction } from "express";

export abstract class BaseController {
  protected readonly router = Router({ mergeParams: true });
  protected abstract initializeRoutes(): void;

  constructor() {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  protected route(
    method: "get" | "post" | "put" | "delete" | "patch",
    path: string,
    ...handlers: RequestHandler[]
  ): void {
    const wrappedHandlers = handlers.map((h) => {
      return (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(h.call(this, req, res, next)).catch(next);
    });
    this.router[method](path, ...wrappedHandlers);
  }
}

export function resolveController<T extends BaseController>(
  ControllerClass: new (...args: any[]) => T
): Router {
  return container.resolve(ControllerClass).getRouter();
}
