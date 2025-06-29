import crypto from "crypto";

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function createFileNameWithContentHash(
  type: string,
  content: string,
  extension: string
): string {
  const contentHash = hashContent(content);
  return `${type}_${contentHash}.${extension}`;
}

export function computeExpectedContentHash(content: string, settings: any): string {
  const hash = crypto.createHash("sha256");
  hash.update(content + JSON.stringify(settings || {}));
  return hash.digest("hex");
}

export function extractContentHashFromPath(path?: string | null): string | null {
  if (!path) return null;
  const parts = path.split(/[/\\_.-]/);
  for (const part of parts) {
    if (part.length === 64 && /^[a-f0-9]{64}$/i.test(part)) {
      return part;
    }
  }
  return null;
}
