import fs from "fs";
import path from "path";
import { inject, injectable } from "tsyringe";
import { promisify } from "util";
import { pipeline } from "stream/promises";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import axios from "axios";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

@injectable()
export class StorageService {
  private readonly basePath: string;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService
  ) {
    //const baseStoragePath = this.configService.get('storage.paths.basePath') || 'storage';
    this.basePath = path.join(process.cwd());
  }

  getPath(baseDir: string, relativePath: string): string {
    return path.join(baseDir, relativePath);
  }

  getFullPath(relativePath: string): string {
    return path.join(this.basePath, relativePath);
  }

  async ensureDirectoriesExist() {
    const paths: string[] = this.configService.get("storage.paths") || [];

    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    for (const p of Object.values(paths)) {
      const fullPath = path.resolve(process.cwd(), p);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logService.info(`Created storage directory: ${fullPath}`);
      }
    }
  }

  async saveFile(filename: string, content: Buffer | string): Promise<string> {
    const filePath = path.join(this.basePath, filename);
    await writeFile(filePath, content);
    return filePath;
  }

  async saveStreamToFile(filename: string, stream: NodeJS.ReadableStream): Promise<string> {
    const filePath = path.join(this.basePath, filename);
    const writer = fs.createWriteStream(filePath);
    await pipeline(stream, writer);
    return filePath;
  }

  async readFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, filename);
    return await readFile(filePath);
  }

  async readFileAsStream(filename: string): Promise<NodeJS.ReadableStream> {
    const filePath = path.join(this.basePath, filename);
    return fs.createReadStream(filePath);
  }

  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.basePath, filename);
    try {
      await access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFileIfExists(relativePath: string, basePath?: string): Promise<void> {
    if (!relativePath?.trim()) {
      this.logService.warn("deleteFileIfExists: empty relative path, skipping.");
      return;
    }

    const resolvedBase = basePath ?? this.basePath;
    const fullPath = path.join(resolvedBase, relativePath);

    try {
      await fs.promises.unlink(fullPath);
    } catch (error) {
      throw error;
    }
  }

  async downloadFileFromUrlAndSave(
    url: string,
    filename: string,
    options?: {
      timeout?: number;
      maxSize?: number;
    }
  ): Promise<string> {
    this.logService.debug("Downloading file from URL:", { url });

    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: options?.timeout ?? 10000,
        maxContentLength: options?.maxSize ?? 10 * 1024 * 1024,
      });

      if (!response.data) {
        throw new Error("No data received from URL");
      }

      const savedPath = await this.saveStreamToFile(filename, response.data);

      this.logService.debug("File downloaded and saved to:", {
        path: savedPath,
      });
      return savedPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logService.error(`Download error: ${message}`, { url, filename });
      throw new Error(`Failed to download file: ${message}`);
    }
  }
}
