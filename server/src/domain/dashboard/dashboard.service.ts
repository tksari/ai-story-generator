import { inject, injectable } from "tsyringe";
import { CacheService } from "@/infrastructure/redis/cache.service";
import { GeneratedImageRepository } from "@/domain/story/page/generated-image/generated-image.repository";
import { GeneratedVideoRepository } from "@/domain/story/page/generated-video/generated-video.repository";
import { GeneratedSpeechRepository } from "@/domain/story/page/generated-speech/generated-speech.repository";
import { StoryRepository } from "@/domain/story/story.repository";

@injectable()
export class DashboardService {
  private readonly CACHE_KEY = "dashboard_stats";
  private readonly CACHE_TTL = 60; // 60 seconds

  constructor(
    @inject("CacheService") private cacheService: CacheService,
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("GeneratedImageRepository")
    private generatedImageRepository: GeneratedImageRepository,
    @inject("GeneratedSpeechRepository")
    private generatedSpeechRepository: GeneratedSpeechRepository,
    @inject("GeneratedVideoRepository")
    private generatedVideoRepository: GeneratedVideoRepository
  ) {}

  async getStats() {
    const cachedStats = await this.cacheService.get(this.CACHE_KEY);

    if (cachedStats) {
      return cachedStats;
    }

    const [imageStats, speechStats, videoStats, storyStats] = await Promise.all([
      this.generatedImageRepository.getStats(),
      this.generatedSpeechRepository.getStats(),
      this.generatedVideoRepository.getStats(),
      this.storyRepository.getStats(),
    ]);

    const stats = {
      images: imageStats,
      speeches: speechStats,
      videos: videoStats,
      stories: storyStats,
    };

    await this.cacheService.set(this.CACHE_KEY, stats, this.CACHE_TTL);

    return stats;
  }
}
