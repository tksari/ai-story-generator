import { inject, injectable } from "tsyringe";
import ffmpeg from "fluent-ffmpeg";
import { LogService } from "@/infrastructure/logging/log.service";
import { GeneratedImage, GeneratedSpeech } from "@prisma/client";
import { Readable } from "stream";
import { StoryPageData } from "@/domain/video/types/video.types";

@injectable()
export class InputPreparationService {
  private mediaInputMap: Record<number, { image?: number; speech?: number }> = {};
  private DUMMY_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  constructor(@inject("LogService") private logService: LogService) {}

  setupInputs(
    command: ffmpeg.FfmpegCommand,
    pages: StoryPageData[]
  ): Record<number, { image?: number; speech?: number }> {
    this.mediaInputMap = {};
    let inputIndex = 0;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      inputIndex = this.addMediaInput(
        command,
        page.generatedImages,
        pageIndex,
        inputIndex,
        "image"
      );
      inputIndex = this.addMediaInput(
        command,
        page.generatedSpeeches,
        pageIndex,
        inputIndex,
        "speech"
      );
    }

    if (inputIndex === 0) {
      this.logService.info(
        "[MediaInput] No media inputs found. Adding a dummy PNG stream to prevent fluent-ffmpeg error."
      );

      const dummyPngBuffer = Buffer.from(this.DUMMY_PNG_BASE64, "base64");

      const readableStream = new Readable();
      readableStream.push(dummyPngBuffer);
      readableStream.push(null);

      command.input(readableStream);
    }

    return this.mediaInputMap;
  }

  getMediaInputMap(): Record<number, { image?: number; speech?: number }> {
    return this.mediaInputMap;
  }

  private addMediaInput(
    command: ffmpeg.FfmpegCommand,
    media: GeneratedImage[] | GeneratedSpeech[] | undefined,
    pageIndex: number,
    inputIndex: number,
    mediaType: "image" | "speech"
  ): number {
    const filePath = media?.[0]?.path;
    if (!filePath) {
      this.logService.warn(`[MediaInput] Skipped ${mediaType} for page ${pageIndex}: file missing`);
      return inputIndex;
    }

    command.input(filePath);

    if (!this.mediaInputMap[pageIndex]) {
      this.mediaInputMap[pageIndex] = {};
    }
    this.mediaInputMap[pageIndex][mediaType] = inputIndex;

    return inputIndex + 1;
  }
}
