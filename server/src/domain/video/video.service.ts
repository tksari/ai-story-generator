import { inject, injectable } from "tsyringe";
import ffmpeg from "fluent-ffmpeg";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { GeneratedVideoRepository } from "@/domain/story/page/generated-video/generated-video.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobService } from "@/domain/job/job.service";
import { genVideoFileName } from "@/utils/index";
import { videoCodecOptions } from "@/domain/shared/generation/default-generation-settings";
import { JobStatus, JobType } from "@prisma/client";
import { LayoutService } from "./layout.service";
import { InputPreparationService } from "./input-preparation.service";
import { DurationService } from "./duration.service";
import { FilterConstructionService } from "./filter-construction.service";
import { FFmpegExecutionService } from "./ffmpeg-execution.service";

import {
  StoryWithPages,
  StorySettings,
  VideoGenerationParams,
} from "@/domain/video/types/video.types";
import { LayoutItem } from "@/domain/video/types/video-layout.types";

@injectable()
export class VideoService {
  private VIDEO_OUTPUT_PATH: string;
  private FFMPEG_PATH: string | undefined;
  private FFPROBE_PATH: string | undefined;

  constructor(
    @inject("ConfigService") private configService: ConfigService,
    @inject("LogService") private logService: LogService,
    @inject("GeneratedVideoRepository")
    private videoRepository: GeneratedVideoRepository,
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("EventEmitterService") private eventEmitter: EventEmitterService,
    @inject("StorageService") private storageService: StorageService,
    @inject("LayoutService") private layoutService: LayoutService,
    @inject("InputPreparationService")
    private inputPreparationService: InputPreparationService,
    @inject("DurationService") private durationService: DurationService,
    @inject("FilterConstructionService")
    private filterConstructionService: FilterConstructionService,
    @inject("FFmpegExecutionService")
    private ffmpegExecutionService: FFmpegExecutionService,
    @inject("JobService") private jobService: JobService
  ) {
    this.initializeFFmpeg();
    this.VIDEO_OUTPUT_PATH = this.configService.get("storage.paths.videos");
  }

  async handleVideoGeneration(taskId: string, storyId: number, videoId: number): Promise<void> {
    this.logService.info(`[Story ${storyId}] Starting video generation process.`);

    try {
      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.IN_PROGRESS}`,
        { storyId, id: videoId }
      );
      await this.videoRepository.update(videoId, {
        status: JobStatus.IN_PROGRESS,
      });

      const story = await this.storyRepository.getStoryWithPages(storyId);
      if (!story) throw new Error(`Story not found`);

      const layout = await this.layoutService.prepareLayout(story);
      const videoSettings = story.settings as StorySettings;
      const outputPath = this.determineOutputPath(storyId, videoId, videoSettings?.video?.codec);

      const videoProgressCallback = (progress: number) => {
        this.eventEmitter.emit(
          `${JobType.STORY}:${storyId}`,
          `${JobType.VIDEO}:${JobStatus.IN_PROGRESS}`,
          {
            storyId,
            id: videoId,
            progress: Math.round(progress),
          }
        );
      };

      const duration = await this.generateVideo(
        { story, layout, progressCallback: videoProgressCallback },
        outputPath
      );
      await this.saveVideoMetadata(videoId, story, layout, outputPath, duration);

      this.logService.info(
        `[Story ${storyId}] Video generation completed successfully. Path: ${outputPath}, Duration: ${duration.toFixed(2)}s`
      );

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.DONE}`,
        {
          storyId,
          id: videoId,
          path: outputPath,
          duration,
        }
      );

      await this.jobService.completeJob(taskId);
    } catch (error: any) {
      this.logService.error(
        `[Story ${storyId}] Critical error during video generation: ${error.message}`
      );
      if (error.stack) this.logService.error(error.stack);

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.FAILED}`,
        {
          storyId,
          id: videoId,
          error: error.message,
        }
      );
      await this.jobService.failJob(taskId, error.message);

      await this.updateVideoRepositoryOnFailure(videoId, error);
      throw error;
    }
  }

  private async generateVideo(params: VideoGenerationParams, outputPath: string): Promise<number> {
    const { story, layout, progressCallback } = params;
    const { pages, settings, id: storyId } = story;

    const pageDurations = await this.durationService.getAllPageDurations(pages);
    const totalDuration = pageDurations.reduce((acc, dur) => acc + parseFloat(dur), 0);

    return new Promise(async (resolve, reject) => {
      try {
        const command = ffmpeg();
        const mediaInputMap = this.inputPreparationService.setupInputs(command, pages);

        const filterResult = this.filterConstructionService.buildComplexFilterString(
          pages,
          layout,
          (settings as StorySettings) || {},
          pageDurations,
          totalDuration,
          mediaInputMap
        );

        command.complexFilter(filterResult.filterString);
        this.ffmpegExecutionService.setupOutputOptions(
          command,
          (settings as StorySettings) || {},
          filterResult.finalVideoLabel,
          filterResult.finalAudioLabel
        );

        const duration = await this.ffmpegExecutionService.executeFFmpegCommand(
          command,
          outputPath,
          totalDuration,
          storyId,
          progressCallback
        );

        resolve(duration);
      } catch (error: any) {
        this.logService.error(`[Story ${storyId}] FFmpeg error: ${error.message}`);
        reject(error);
      }
    });
  }

  private async saveVideoMetadata(
    videoId: number,
    story: StoryWithPages,
    layout: LayoutItem[],
    outputPath: string,
    duration: number
  ): Promise<any> {
    const settings = story.settings as StorySettings;

    try {
      const videoRecord = await this.videoRepository.update(videoId, {
        title: story.title,
        path: outputPath,
        status: JobStatus.DONE,
        duration,
        metadata: {
          pageCount: story.pages.length,
          settings: settings,
          layoutUsed: layout,
          resolution: settings?.video?.resolution || "N/A",
        },
      });

      this.logService.info(`[Story ${story.id}] Video metadata saved (ID: ${videoRecord.id})`);
      return videoRecord;
    } catch (error: any) {
      this.logService.error(`[Story ${story.id}] Failed to save metadata: ${error.message}`);
      throw new Error(
        `Video generated (${outputPath}) but failed to save metadata: ${error.message}`
      );
    }
  }

  private determineOutputPath(storyId: number, videoId: number, codec?: string): string {
    const matched = videoCodecOptions.find((opt) => opt.value === codec);
    const extension = matched?.container || "mp4";
    const outputFilename = genVideoFileName({
      id: `${storyId}${videoId}`,
      extension,
    });

    const outputPath = this.storageService.getPath(this.VIDEO_OUTPUT_PATH, outputFilename);
    this.logService.debug(`[Story ${storyId}] Output path determined: ${outputPath}`);
    return outputPath;
  }

  private initializeFFmpeg(): void {
    this.FFMPEG_PATH = this.configService.get("FFMPEG_PATH");
    this.FFPROBE_PATH = this.configService.get("FFPROBE_PATH");

    if (this.FFMPEG_PATH) ffmpeg.setFfmpegPath(this.FFMPEG_PATH);
    if (this.FFPROBE_PATH) ffmpeg.setFfprobePath(this.FFPROBE_PATH);

    this.logService.info(`Using FFmpeg from: ${this.FFMPEG_PATH || "System Default"}`);
    this.logService.info(`Using FFprobe from: ${this.FFPROBE_PATH || "System Default"}`);
  }

  private async updateVideoRepositoryOnFailure(videoId: number, error: any): Promise<void> {
    try {
      await this.videoRepository.update(videoId, {
        status: JobStatus.FAILED,
        path: "",
        title: "",
        metadata: {
          error: error.message,
          errorTime: new Date().toISOString(),
        },
      });
    } catch (dbError: any) {
      this.logService.error(
        `[Video ${videoId}] Failed to update video status in database: ${dbError.message}`
      );
    }
  }
}
