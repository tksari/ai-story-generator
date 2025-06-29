import { inject, injectable } from "tsyringe";
import ffmpeg from "fluent-ffmpeg";
import { LogService } from "@/infrastructure/logging/log.service";
import {
  VideoCodecSettings,
  AudioCodecSettings,
  StorySettings,
} from "@/domain/video/types/video.types";

@injectable()
export class FFmpegExecutionService {
  constructor(@inject("LogService") private logService: LogService) {}

  setupOutputOptions(
    command: ffmpeg.FfmpegCommand,
    settings: StorySettings,
    finalVideoLabel: string,
    finalAudioLabel: string
  ): void {
    command.addOutputOption("-map", finalVideoLabel);
    command.addOutputOption("-map", finalAudioLabel);
    const outputOptions = this.buildCodecOutputOptions(settings.video || {}, settings.audio || {});

    command.outputOptions(outputOptions);
    command.addOutputOption("-loglevel", "debug");
    this.logService.info(
      `[Setup Output] Mapping streams: ${finalVideoLabel} (video), ${finalAudioLabel} (audio)`
    );
    this.logService.debug(
      `[Setup Output] Applying codec/muxer options: ${outputOptions.join(" ")} -loglevel debug`
    );
  }

  executeFFmpegCommand(
    command: ffmpeg.FfmpegCommand,
    outputPath: string,
    totalDuration: number,
    storyId: number,
    progressCallback?: (progress: number) => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let lastPercent = -1;
      let ffmpegEnded = false;
      let stderrOutput = "";
      let videoDuration = 0;

      command
        .on("start", (commandLine) => {
          this.logService.info(`[Story ${storyId}] FFmpeg started with command:\n${commandLine}`);
        })
        .on("progress", (progress) => {
          if (ffmpegEnded) return;

          if (progress?.timemark) {
            const [hours, minutes, seconds] = progress.timemark.split(":").map(Number);
            videoDuration = hours * 3600 + minutes * 60 + seconds;
          }

          let percent = 0;
          if (progress?.timemark) {
            const [hours, minutes, seconds] = progress.timemark.split(":").map(Number);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            percent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));
          } else if (progress?.frames) {
            percent = Math.min(100, Math.max(0, (progress.frames / (totalDuration * 25)) * 100));
          }

          this.logService.debug(
            `[Story ${storyId}] FFmpeg progress: ${Math.round(percent)}% | ` +
              `FPS: ${progress?.currentFps || 0} | ` +
              `Bitrate: ${progress?.currentKbps || 0}kbps | ` +
              `Time: ${progress?.timemark || "N/A"} | ` +
              `Duration: ${videoDuration.toFixed(2)}s`
          );

          if (!isNaN(percent) && percent !== lastPercent) {
            lastPercent = percent;
            if (progressCallback) progressCallback(Math.round(percent));
          }
        })
        .on("stderr", (stderrLine) => {
          if (ffmpegEnded) return;
          stderrOutput += stderrLine + "\n";
          if (stderrLine.includes("Error") || stderrLine.includes("error")) {
            this.logService.warn(`[Story ${storyId}] FFmpeg stderr: ${stderrLine}`);
          }
        })
        .on("error", (err, stdout, stderr) => {
          if (ffmpegEnded) return;
          ffmpegEnded = true;
          this.logService.error(`[Story ${storyId}] FFmpeg error: ${err.message}`);
          if (stdout) this.logService.error(`[Story ${storyId}] FFmpeg stdout:\n${stdout}`);
          if (stderr) this.logService.error(`[Story ${storyId}] FFmpeg stderr:\n${stderr}`);
          reject(err);
        })
        .on("end", (stdout, stderr_from_event) => {
          if (ffmpegEnded) return;
          ffmpegEnded = true;
          this.logService.info(`[Story ${storyId}] FFmpeg process finished successfully.`);
          if (stdout)
            this.logService.info(`[Story ${storyId}] FFmpeg stdout (end):\n---\n${stdout}\n---`);
          const finalStderr = stderr_from_event || stderrOutput;
          if (finalStderr)
            this.logService.warn(
              `[Story ${storyId}] FFmpeg stderr (end - may contain warnings):\n--- STDERR START ---\n${finalStderr}\n--- STDERR END ---`
            );

          if (videoDuration === 0) {
            videoDuration = totalDuration;
            this.logService.warn(
              `[Story ${storyId}] Using calculated duration: ${videoDuration.toFixed(2)}s`
            );
          } else {
            this.logService.info(
              `[Story ${storyId}] Final video duration: ${videoDuration.toFixed(2)}s`
            );
          }

          if (lastPercent < 100) {
            this.logService.info(`[Story ${storyId}] Sending final 100% progress update.`);
            if (progressCallback) progressCallback(100);
          }
          resolve(videoDuration);
        })
        .save(outputPath);
    });
  }

  private buildCodecOutputOptions(
    videoSettings: VideoCodecSettings,
    audioSettings: AudioCodecSettings
  ): string[] {
    const options: string[] = [];

    const codec = videoSettings.codec || "libx264";
    const pixelFormat = videoSettings.pixel_format || "yuv420p";
    const isAlphaFormat = pixelFormat.startsWith("yuva") || ["rgba", "argb"].includes(pixelFormat);
    const isAlphaCodec = ["prores_ks", "libvpx", "qtrle"].includes(codec);

    options.push("-c:v", codec);
    options.push("-pix_fmt", pixelFormat);
    options.push("-r", String(videoSettings.fps || 25));

    if (videoSettings.bitrate) {
      options.push("-b:v", videoSettings.bitrate);
    } else if (codec === "libx264") {
      options.push("-preset", videoSettings.quality || "medium");
      options.push("-crf", "23");
    } else if (codec === "prores_ks") {
      options.push("-profile:v", "4");
    }

    options.push("-c:a", audioSettings.codec || "aac");
    if (audioSettings.bitrate) {
      options.push("-b:a", audioSettings.bitrate);
    } else if (!audioSettings.codec || audioSettings.codec === "aac") {
      options.push("-b:a", "128k");
    }

    options.push("-ac", String(audioSettings.channels || 2));
    options.push("-ar", String(audioSettings.sample_rate || 44100));

    if (!isAlphaFormat && !isAlphaCodec) {
      options.push("-movflags", "+faststart");
    }

    return options;
  }
}
