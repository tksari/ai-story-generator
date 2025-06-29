import { baseUrl } from "@/services/api";

export function getMediaUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return `${baseUrl}/media/${path}`;
}
