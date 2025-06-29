import { DurationService } from "@/domain/video/duration.service";
import { StoryPageData } from "@/domain/video/types/video.types";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobStatus } from "@prisma/client";

type FFprobeCallback = (err: Error | null, data: any) => void;

jest.mock("fluent-ffmpeg", () => ({
  ffprobe: jest.fn((path: string, callback: FFprobeCallback) => {
    callback(null, { format: { duration: 10 } });
  }),
}));

describe("DurationService", () => {
  let durationService: DurationService;
  let mockStorageService: jest.Mocked<StorageService>;

  beforeEach(() => {
    mockStorageService = {
      getFullPath: jest.fn().mockReturnValue("/mock/path"),
    } as any;

    durationService = new DurationService(mockStorageService);
    jest.spyOn(durationService, "getAudioDuration");
  });

  describe("getAllPageDurations", () => {
    it("should return durations for pages with completed speeches", async () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedSpeeches: [{ isDefault: true, status: JobStatus.DONE, path: "path1" }],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedSpeeches: [{ isDefault: true, status: JobStatus.DONE, path: "path2" }],
        },
      ] as StoryPageData[];

      const result = await durationService.getAllPageDurations(pages);

      expect(result).toEqual(["10", "10"]);
      expect(durationService.getAudioDuration).toHaveBeenCalledTimes(2);
    });

    it("should return default duration for pages without default speech", async () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedSpeeches: [],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedSpeeches: [],
        },
      ];

      const result = await durationService.getAllPageDurations(pages);

      expect(result).toEqual(["5", "5"]);
      expect(durationService.getAudioDuration).not.toHaveBeenCalled();
    });

    it("should return default duration for pages with incomplete speeches", async () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedSpeeches: [{ isDefault: true, status: JobStatus.PENDING, path: "path1" }],
        },
      ] as StoryPageData[];

      const result = await durationService.getAllPageDurations(pages);

      expect(result).toEqual(["5"]);
      expect(durationService.getAudioDuration).not.toHaveBeenCalled();
    });

    it("should handle mixed scenarios correctly", async () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedSpeeches: [{ isDefault: true, status: JobStatus.DONE, path: "path1" }],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedSpeeches: [],
        },
      ] as StoryPageData[];

      const result = await durationService.getAllPageDurations(pages);

      expect(result).toEqual(["10", "5"]);
      expect(durationService.getAudioDuration).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAudioDuration", () => {
    it("should return audio duration from ffprobe metadata", async () => {
      const result = await durationService.getAudioDuration("test.mp3");
      expect(result).toBe("10");
    });

    it("should return default duration when metadata has no duration", async () => {
      jest
        .spyOn(require("fluent-ffmpeg"), "ffprobe")
        .mockImplementationOnce((...args: unknown[]) => {
          const callback = args[1] as FFprobeCallback;
          callback(null, { format: {} });
        });

      const result = await durationService.getAudioDuration("test.mp3");
      expect(result).toBe("5");
    });

    it("should return default duration when metadata format is undefined", async () => {
      jest
        .spyOn(require("fluent-ffmpeg"), "ffprobe")
        .mockImplementationOnce((...args: unknown[]) => {
          const callback = args[1] as FFprobeCallback;
          callback(null, {});
        });

      const result = await durationService.getAudioDuration("test.mp3");
      expect(result).toBe("5");
    });

    it("should reject when ffprobe returns an error", async () => {
      jest
        .spyOn(require("fluent-ffmpeg"), "ffprobe")
        .mockImplementationOnce((...args: unknown[]) => {
          const callback = args[1] as FFprobeCallback;
          callback(new Error("FFprobe error"), null);
        });

      await expect(durationService.getAudioDuration("test.mp3")).rejects.toThrow("FFprobe error");
    });
  });

  describe("calculateStartTime", () => {
    it("should calculate correct start time for first page", () => {
      const durations = ["5", "10", "15"];
      const result = durationService.calculateStartTime(durations, 0);
      expect(result).toBe(0);
    });

    it("should calculate correct start time for middle page", () => {
      const durations = ["5", "10", "15"];
      const result = durationService.calculateStartTime(durations, 1);
      expect(result).toBe(5);
    });

    it("should calculate correct start time for last page", () => {
      const durations = ["5", "10", "15"];
      const result = durationService.calculateStartTime(durations, 2);
      expect(result).toBe(15);
    });

    it("should handle empty duration array", () => {
      const result = durationService.calculateStartTime([], 0);
      expect(result).toBe(0);
    });

    it("should handle decimal durations correctly", () => {
      const durations = ["5.5", "10.2", "15.7"];
      const result = durationService.calculateStartTime(durations, 1);
      expect(result).toBe(5.5);
    });

    it("should handle string number durations", () => {
      const durations = ["5", "10", "15"];
      const result = durationService.calculateStartTime(durations, 1);
      expect(result).toBe(5);
    });
  });
});
