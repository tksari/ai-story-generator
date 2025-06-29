import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import { sanitizePayload, shouldSkipRequestLog } from "@/domain/request-log/request-utils";

export const REQUEST_LOG_IGNORE_PATHS = ["/api/request-logs"];

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestLogService = container.resolve<RequestLogService>("RequestLogService");

  const start = Date.now();

  res.on("finish", () => {
    if (shouldSkipRequestLog(req.originalUrl)) {
      return;
    }

    const duration = Date.now() - start;
    const logData = {
      type: "HTTP",
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      responseBody:
        res.statusCode < 400 ? sanitizePayload(res.locals?.responseBody || {}) : undefined,
      error:
        res.statusCode >= 400
          ? {
              message: res.statusMessage,
              body: res.locals?.responseBody,
            }
          : undefined,
      duration,
      requestMeta: {
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    };

    void requestLogService.log(logData);
  });

  next();
}

export function responseCaptureMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;

  res.send = function (body: any): Response {
    res.locals.responseBody = body;
    return originalSend.call(this, body);
  };

  next();
}
