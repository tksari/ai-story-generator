import { randomBytes } from "crypto";
import path from "path";

export interface FileNameOptions {
  originalName?: string;
  extension?: string;
  prefix?: string;
  id?: string | number;
  includeDate?: boolean;
}

export function generateFileName(options: FileNameOptions = {}): string {
  const { originalName, extension, prefix, id, includeDate = true } = options;

  let ext = "";
  if (originalName) {
    ext = path.extname(originalName);
  } else if (extension) {
    ext = extension.startsWith(".") ? extension : `.${extension}`;
  }

  const baseName = [];

  if (includeDate) {
    const now = new Date();
    const date = now.toISOString().split("T")[0].replace(/-/g, "");
    baseName.push(date);
  }

  if (prefix) {
    baseName.push(prefix);
  }

  if (id) {
    const cleanId = String(id)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8);
    baseName.push(cleanId);
  }

  const unique = `${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
  baseName.push(unique);

  return baseName.join("_") + ext;
}

export const genImageFileName = (opts: Omit<FileNameOptions, "prefix">) =>
  generateFileName({ ...opts, prefix: "img" });

export const genVideoFileName = (opts: Omit<FileNameOptions, "prefix">) =>
  generateFileName({ ...opts, prefix: "vid" });

export const genAudioFileName = (opts: Omit<FileNameOptions, "prefix">) =>
  generateFileName({ ...opts, prefix: "aud" });

export const genSpeechFileName = (opts: Omit<FileNameOptions, "prefix">) =>
  generateFileName({ ...opts, prefix: "tts" });

export const genTempFileName = (opts: Omit<FileNameOptions, "prefix">) =>
  generateFileName({ ...opts, prefix: "tmp" });

export const getContentType = (ext: string): string => {
  const contentTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };

  return contentTypes[ext] || "application/octet-stream";
};
