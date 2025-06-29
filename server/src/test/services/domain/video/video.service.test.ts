import { VideoService } from "@/domain/video/video.service";
import { ConfigService } from "@/config/config.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { GeneratedVideoRepository } from "@/domain/story/page/generated-video/generated-video.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { LayoutService } from "@/domain/video/layout.service";
import { TextProcessingService } from "@/domain/video/text-processing.service";
import { InputPreparationService } from "@/domain/video/input-preparation.service";
import { DurationService } from "@/domain/video/duration.service";
import { FilterConstructionService } from "@/domain/video/filter-construction.service";
import { FFmpegExecutionService } from "@/domain/video/ffmpeg-execution.service";
import { JobStatus, JobType } from "@prisma/client";
import { JobService } from "@/domain/job/job.service";

jest.mock("@/utils/index", () => ({
  genVideoFileName: jest.fn().mockReturnValue("test-video.mp4"),
}));

jest.mock("fluent-ffmpeg", () => {
  const mockFFmpegCommand = {
    complexFilter: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
  };

  const mockFfmpeg = jest.fn().mockReturnValue(mockFFmpegCommand) as any;
  mockFfmpeg.setFfmpegPath = jest.fn();
  mockFfmpeg.setFfprobePath = jest.fn();
  mockFfmpeg.ffprobe = jest.fn((path, cb) => {
    cb(null, { streams: [] });
  });

  return {
    __esModule: true,
    default: mockFfmpeg,
  };
});

describe("VideoService", () => {
  let videoService: VideoService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLogService: jest.Mocked<LogService>;
  let mockVideoRepository: jest.Mocked<GeneratedVideoRepository>;
  let mockStoryRepository: jest.Mocked<StoryRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitterService>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockLayoutService: jest.Mocked<LayoutService>;
  let mockTextProcessingService: jest.Mocked<TextProcessingService>;
  let mockInputPreparationService: jest.Mocked<InputPreparationService>;
  let mockDurationService: jest.Mocked<DurationService>;
  let mockFilterConstructionService: jest.Mocked<FilterConstructionService>;
  let mockFFmpegExecutionService: jest.Mocked<FFmpegExecutionService>;
  let mockJobService: jest.Mocked<JobService>;

  const mockStory = {
    id: 1,
    title: "Test Story",
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    generationConfig: {},
    pages: [
      {
        pageNumber: 1,
        content: "Test content",
        generatedSpeeches: [{ isDefault: true, status: JobStatus.DONE, path: "test-audio.mp3" }],
      },
    ],
    settings: {
      video: {
        codec: "h264",
        resolution: "1080p",
      },
    },
  };

  const mockLayout = [
    {
      type: "text",
      color: "#000000",
      fontSize: 24,
      position: { x: 0, y: 0 },
      width: 500,
      height: 200,
    },
  ];

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "storage.paths.videos") return "/videos";
        if (key === "FFMPEG_PATH") return "/usr/bin/ffmpeg";
        if (key === "FFPROBE_PATH") return "/usr/bin/ffprobe";
        return "";
      }),
    } as any;

    mockLogService = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockVideoRepository = {
      update: jest.fn().mockImplementation((id, data) =>
        Promise.resolve({
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
    } as any;

    mockStoryRepository = {
      getStoryWithPages: jest.fn().mockResolvedValue(mockStory),
    } as any;

    mockEventEmitter = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockStorageService = {
      getPath: jest.fn().mockReturnValue("/videos/test-video.mp4"),
      getFullPath: jest.fn().mockReturnValue("/full/path/to/video.mp4"),
    } as any;

    mockLayoutService = {
      prepareLayout: jest.fn().mockResolvedValue(mockLayout),
    } as any;

    mockTextProcessingService = {} as any;
    mockInputPreparationService = {
      setupInputs: jest.fn().mockReturnValue({}),
    } as any;

    mockDurationService = {
      getAllPageDurations: jest.fn().mockResolvedValue(["5"]),
    } as any;

    mockFilterConstructionService = {
      buildComplexFilterString: jest.fn().mockReturnValue({
        filterString: "test-filter",
        finalVideoLabel: "v",
        finalAudioLabel: "a",
      }),
    } as any;

    mockFFmpegExecutionService = {
      setupOutputOptions: jest.fn(),
      executeFFmpegCommand: jest.fn().mockResolvedValue(5),
    } as any;

    mockJobService = {
      updateJobStatus: jest.fn().mockResolvedValue(undefined),
      failJob: jest.fn().mockResolvedValue(undefined),
      completeJob: jest.fn().mockResolvedValue(undefined),
      startJob: jest.fn().mockResolvedValue(undefined),
    } as any;

    videoService = new VideoService(
      mockConfigService,
      mockLogService,
      mockVideoRepository,
      mockStoryRepository,
      mockEventEmitter,
      mockStorageService,
      mockLayoutService,
      mockInputPreparationService,
      mockDurationService,
      mockFilterConstructionService,
      mockFFmpegExecutionService,
      mockJobService
    );

    jest.clearAllMocks();
  });

  describe("handleVideoGeneration", () => {
    it("should successfully generate video", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";

      await videoService.handleVideoGeneration(taskId, storyId, videoId);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.IN_PROGRESS}`,
        { storyId, id: videoId }
      );

      expect(mockLayoutService.prepareLayout).toHaveBeenCalledWith(mockStory);
      expect(mockDurationService.getAllPageDurations).toHaveBeenCalledWith(mockStory.pages);
      expect(mockInputPreparationService.setupInputs).toHaveBeenCalled();
      expect(mockFilterConstructionService.buildComplexFilterString).toHaveBeenCalled();
      expect(mockFFmpegExecutionService.setupOutputOptions).toHaveBeenCalled();
      expect(mockFFmpegExecutionService.executeFFmpegCommand).toHaveBeenCalled();

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.DONE,
          path: "/videos/test-video.mp4",
          duration: 5,
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.DONE}`,
        expect.objectContaining({
          storyId,
          id: videoId,
          path: "/videos/test-video.mp4",
          duration: 5,
        })
      );
    });

    it("should handle story not found error", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";

      mockStoryRepository.getStoryWithPages.mockResolvedValue(null);

      await expect(videoService.handleVideoGeneration(taskId, storyId, videoId)).rejects.toThrow(
        "Story not found"
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.FAILED}`,
        expect.objectContaining({
          storyId,
          id: videoId,
          error: "Story not found",
        })
      );

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.FAILED,
          path: "",
          title: "",
          metadata: expect.objectContaining({
            error: "Story not found",
          }),
        })
      );
    });

    it("should handle FFmpeg error", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";
      const ffmpegError = new Error("FFmpeg error");
      mockFFmpegExecutionService.executeFFmpegCommand.mockRejectedValue(ffmpegError);

      await expect(videoService.handleVideoGeneration(taskId, storyId, videoId)).rejects.toThrow(
        "FFmpeg error"
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.FAILED}`,
        expect.objectContaining({
          storyId,
          id: videoId,
          error: "FFmpeg error",
        })
      );

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.FAILED,
          path: "",
          title: "",
          metadata: expect.objectContaining({
            error: "FFmpeg error",
          }),
        })
      );
    });

    it("should handle database error during metadata save", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";
      const dbError = new Error("Database error");
      mockFFmpegExecutionService.executeFFmpegCommand.mockResolvedValue(5);
      mockVideoRepository.update.mockRejectedValue(dbError);

      await expect(videoService.handleVideoGeneration(taskId, storyId, videoId)).rejects.toThrow(
        "Database error"
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `${JobType.STORY}:${storyId}`,
        `${JobType.VIDEO}:${JobStatus.FAILED}`,
        expect.objectContaining({
          storyId,
          id: videoId,
          error: "Database error",
        })
      );
    });

    it("should handle story with no images", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";
      const storyWithoutImages = {
        ...mockStory,
        pages: [
          {
            pageNumber: 1,
            content: "Test content without image",
            generatedSpeeches: [
              {
                isDefault: true,
                status: JobStatus.DONE,
                path: "test-audio.mp3",
              },
            ],
          },
        ],
      };
      mockStoryRepository.getStoryWithPages.mockResolvedValue(storyWithoutImages);

      await videoService.handleVideoGeneration(taskId, storyId, videoId);

      expect(mockLayoutService.prepareLayout).toHaveBeenCalledWith(storyWithoutImages);
      expect(mockDurationService.getAllPageDurations).toHaveBeenCalledWith(
        storyWithoutImages.pages
      );
      expect(mockInputPreparationService.setupInputs).toHaveBeenCalled();
      expect(mockFilterConstructionService.buildComplexFilterString).toHaveBeenCalled();
      expect(mockFFmpegExecutionService.executeFFmpegCommand).toHaveBeenCalled();

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.DONE,
          path: "/videos/test-video.mp4",
          duration: 5,
        })
      );
    });

    it("should handle story with no audio", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";
      const storyWithoutAudio = {
        ...mockStory,
        pages: [
          {
            pageNumber: 1,
            content: "Test content without audio",
            generatedSpeeches: [],
          },
        ],
      };
      mockStoryRepository.getStoryWithPages.mockResolvedValue(storyWithoutAudio);

      await videoService.handleVideoGeneration(taskId, storyId, videoId);

      expect(mockLayoutService.prepareLayout).toHaveBeenCalledWith(storyWithoutAudio);
      expect(mockDurationService.getAllPageDurations).toHaveBeenCalledWith(storyWithoutAudio.pages);
      expect(mockInputPreparationService.setupInputs).toHaveBeenCalled();
      expect(mockFilterConstructionService.buildComplexFilterString).toHaveBeenCalled();
      expect(mockFFmpegExecutionService.executeFFmpegCommand).toHaveBeenCalled();

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.DONE,
          path: "/videos/test-video.mp4",
          duration: 5,
        })
      );
    });

    it("should handle story with no images and no audio", async () => {
      const storyId = 1;
      const videoId = 1;
      const taskId = "1";
      const storyWithoutMedia = {
        ...mockStory,
        pages: [
          {
            pageNumber: 1,
            content: "Test content without any media",
            generatedSpeeches: [],
          },
        ],
      };
      mockStoryRepository.getStoryWithPages.mockResolvedValue(storyWithoutMedia);

      await videoService.handleVideoGeneration(taskId, storyId, videoId);

      expect(mockLayoutService.prepareLayout).toHaveBeenCalledWith(storyWithoutMedia);
      expect(mockDurationService.getAllPageDurations).toHaveBeenCalledWith(storyWithoutMedia.pages);
      expect(mockInputPreparationService.setupInputs).toHaveBeenCalled();
      expect(mockFilterConstructionService.buildComplexFilterString).toHaveBeenCalled();
      expect(mockFFmpegExecutionService.executeFFmpegCommand).toHaveBeenCalled();

      expect(mockVideoRepository.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          status: JobStatus.DONE,
          path: "/videos/test-video.mp4",
          duration: 5,
        })
      );
    });
  });

  describe("determineOutputPath", () => {
    it("should determine correct output path with default codec", () => {
      const storyId = 1;
      const videoId = 1;
      const outputPath = (videoService as any).determineOutputPath(storyId, videoId);

      expect(outputPath).toBe("/videos/test-video.mp4");
      expect(mockStorageService.getPath).toHaveBeenCalledWith("/videos", "test-video.mp4");
    });

    it("should determine correct output path with custom codec", () => {
      const storyId = 1;
      const videoId = 1;
      const outputPath = (videoService as any).determineOutputPath(storyId, videoId, "h264");

      expect(outputPath).toBe("/videos/test-video.mp4");
      expect(mockStorageService.getPath).toHaveBeenCalledWith("/videos", "test-video.mp4");
    });
  });
});
