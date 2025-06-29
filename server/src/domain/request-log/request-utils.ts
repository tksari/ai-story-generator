import { REQUEST_LOG_IGNORE_PATHS } from "@/domain/request-log/request-log.config";

const DEFAULT_MAX_BODY_LENGTH = 1000;

export function sanitizePayload(payload: any, maxLength = DEFAULT_MAX_BODY_LENGTH): any {
  try {
    const jsonString = JSON.stringify(payload);
    if (jsonString.length > maxLength) {
      return {
        preview: jsonString.slice(0, maxLength),
        truncated: true,
        originalLength: jsonString.length,
      };
    }
    return payload;
  } catch {
    return { error: "Could not stringify" };
  }
}

export function shouldSkipRequestLog(url: string): boolean {
  return REQUEST_LOG_IGNORE_PATHS.some((path) => url.includes(path));
}
