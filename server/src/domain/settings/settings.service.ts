import { injectable, inject } from "tsyringe";
import { SettingsRepository } from "@/domain/settings/settings.repository";
import { Settings, UpdateSettings } from "@/domain/settings/settings.schema";
import { CacheService } from "@/infrastructure/redis/cache.service";

@injectable()
export class SettingsService {
  private readonly CACHE_KEY = "settings";
  private readonly CACHE_TTL = 300;

  constructor(
    @inject("SettingsRepository")
    private settingsRepository: SettingsRepository,
    @inject("CacheService") private cacheService: CacheService
  ) {}

  async getSettings(): Promise<Settings | null> {
    const cachedSettings = await this.cacheService.get<Settings>(this.CACHE_KEY);
    if (cachedSettings) {
      return cachedSettings;
    }

    const settings = await this.settingsRepository.getSettings();
    if (settings) {
      await this.cacheService.set(this.CACHE_KEY, settings, this.CACHE_TTL);
    }
    return settings;
  }

  async updateSettings(data: UpdateSettings): Promise<Settings> {
    const settings = await this.settingsRepository.updateSettings(data);
    await this.cacheService.set(this.CACHE_KEY, settings, this.CACHE_TTL);
    return settings;
  }

  async getUseFakeProvider(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings?.useFakeProvider ?? true;
  }
}
