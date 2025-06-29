import { injectable } from "tsyringe";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";

@injectable()
export class ConfigService {
  private envCache: Record<string, string> = {};
  private yamlConfig: any = {};

  constructor() {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    this.cacheCommonValues();
    this.loadYamlConfig();
  }

  private loadYamlConfig(): void {
    const yamlPath = path.resolve(__dirname, "./config.yml");
    if (fs.existsSync(yamlPath)) {
      const fileContent = fs.readFileSync(yamlPath, "utf8");
      this.yamlConfig = yaml.load(fileContent);
    }
  }

  get(key: string): any {
    if (this.envCache[key] !== undefined) {
      return this.envCache[key];
    }

    const keys = key.split(".");
    let result = this.yamlConfig;
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k];
      } else {
        return undefined;
      }
    }
    return result;
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return defaultValue ?? 0;
    return parsed;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key);
    if (value === undefined) return defaultValue ?? false;
    return value === true || value === "true";
  }

  isProduction(): boolean {
    return this.envCache.NODE_ENV === "production";
  }

  isDevelopment(): boolean {
    return this.envCache.NODE_ENV === "development";
  }

  private cacheCommonValues(): void {
    for (const key in process.env) {
      this.envCache[key] = process.env[key] || "";
    }
  }
}
