import { inject, injectable } from "tsyringe";
import ffmpeg from "fluent-ffmpeg";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobStatus } from "@prisma/client";
import { StoryPageData } from "@/domain/video/types/video.types";

@injectable()
export class DurationService {
  constructor(@inject("StorageService") private storageService: StorageService) {}

  async getAllPageDurations(pages: StoryPageData[]): Promise<string[]> {
    return Promise.all(
      pages.map((page) => {
        const speech = page.generatedSpeeches?.find(
          (s) => s.isDefault && s.status === JobStatus.DONE
        );
        return speech?.path ? this.getAudioDuration(speech.path) : Promise.resolve("5");
      })
    );
  }

  async getAudioDuration(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPath = this.storageService.getFullPath(path);
      ffmpeg.ffprobe(fullPath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format?.duration;
        resolve(duration ? duration?.toString() : "5");
      });
    });
  }

  calculateStartTime(pageDurations: string[], pageIndex: number): number {
    return pageDurations.slice(0, pageIndex).reduce((acc, dur) => acc + parseFloat(dur), 0);
  }
}
