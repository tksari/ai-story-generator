import { LogService } from "@/infrastructure/logging/log.service";
import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const logService = container.resolve<LogService>("LogService");

  logService.error(`Error in ${req.method} ${req.path}: ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  if (err.name === "PrismaClientKnownRequestError") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (err.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "A record with this unique constraint already exists",
      });
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (err.code === "P2025") {
      return res.status(404).json({
        status: "error",
        message: "Record not found",
      });
    }
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: JSON.parse(err.message),
    });
  }

  return res.status(500).json({
    status: "error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  });
};
