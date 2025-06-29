import { FFmpegExecutionService } from "@/domain/video/ffmpeg-execution.service";
import { LogService } from "@/infrastructure/logging/log.service";
import ffmpeg from "fluent-ffmpeg";

jest.mock("fluent-ffmpeg");
const mockFfmpeg = ffmpeg as jest.Mocked<typeof ffmpeg>;

describe("FFmpegExecutionService", () => {
  let ffmpegExecutionService: FFmpegExecutionService;
  let mockLogService: jest.Mocked<LogService>;
  let mockCommand: any;

  beforeEach(() => {
    mockLogService = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockCommand = {
      addOutputOption: jest.fn().mockReturnThis(),
      outputOptions: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      save: jest.fn().mockReturnThis(),
    };

    (mockFfmpeg as any).mockReturnValue(mockCommand);

    ffmpegExecutionService = new FFmpegExecutionService(mockLogService);

    jest.clearAllMocks();
  });

  describe("setupOutputOptions", () => {
    it("should set up output options correctly with default settings", () => {
      const settings = {};
      const finalVideoLabel = "[v]";
      const finalAudioLabel = "[a]";

      ffmpegExecutionService.setupOutputOptions(
        mockCommand,
        settings,
        finalVideoLabel,
        finalAudioLabel
      );

      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalVideoLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalAudioLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-loglevel", "debug");
      expect(mockCommand.outputOptions).toHaveBeenCalled();
      expect(mockLogService.info).toHaveBeenCalledWith(
        expect.stringContaining("[Setup Output] Mapping streams")
      );
      expect(mockLogService.debug).toHaveBeenCalledWith(
        expect.stringContaining("[Setup Output] Applying codec/muxer options")
      );
    });

    it("should set up output options with custom video settings", () => {
      const settings = {
        video: {
          codec: "libx264",
          fps: 30,
          bitrate: "2000k",
          quality: "high",
          resolution: "1920x1080",
          pixel_format: "yuv420p",
        },
      };
      const finalVideoLabel = "[v]";
      const finalAudioLabel = "[a]";

      ffmpegExecutionService.setupOutputOptions(
        mockCommand,
        settings,
        finalVideoLabel,
        finalAudioLabel
      );

      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalVideoLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalAudioLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-loglevel", "debug");
      expect(mockCommand.outputOptions).toHaveBeenCalled();
    });

    it("should set up output options with custom audio settings", () => {
      const settings = {
        audio: {
          codec: "aac",
          bitrate: "192k",
          channels: 2,
          normalization: true,
          sample_rate: 48000,
        },
      };
      const finalVideoLabel = "[v]";
      const finalAudioLabel = "[a]";

      ffmpegExecutionService.setupOutputOptions(
        mockCommand,
        settings,
        finalVideoLabel,
        finalAudioLabel
      );

      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalVideoLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-map", finalAudioLabel);
      expect(mockCommand.addOutputOption).toHaveBeenCalledWith("-loglevel", "debug");
      expect(mockCommand.outputOptions).toHaveBeenCalled();
    });
  });

  describe("executeFFmpegCommand", () => {
    const mockOutputPath = "/path/to/output.mp4";
    const mockTotalDuration = 30;
    const mockStoryId = 123;

    it("should execute ffmpeg command successfully", async () => {
      const progressCallback = jest.fn();
      let onProgressCallback: any;
      let onEndCallback: any;

      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "progress") {
          onProgressCallback = callback;
        } else if (event === "end") {
          onEndCallback = callback;
        }
        return mockCommand;
      });

      const executionPromise = ffmpegExecutionService.executeFFmpegCommand(
        mockCommand,
        mockOutputPath,
        mockTotalDuration,
        mockStoryId,
        progressCallback
      );

      onProgressCallback({
        timemark: "00:00:15.00",
        frames: 375,
        currentFps: 25,
        currentKbps: 2000,
      });
      onProgressCallback({
        timemark: "00:00:30.00",
        frames: 750,
        currentFps: 25,
        currentKbps: 2000,
      });

      onEndCallback();

      const result = await executionPromise;

      expect(result).toBe(mockTotalDuration);
      expect(mockCommand.save).toHaveBeenCalledWith(mockOutputPath);
      expect(progressCallback).toHaveBeenCalledWith(50);
      expect(progressCallback).toHaveBeenCalledWith(100);
      expect(mockLogService.info).toHaveBeenCalledWith(
        expect.stringContaining("FFmpeg process finished successfully")
      );
    });

    it("should handle ffmpeg error", async () => {
      const progressCallback = jest.fn();
      let onErrorCallback: any;

      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "error") {
          onErrorCallback = callback;
        }
        return mockCommand;
      });

      const executionPromise = ffmpegExecutionService.executeFFmpegCommand(
        mockCommand,
        mockOutputPath,
        mockTotalDuration,
        mockStoryId,
        progressCallback
      );

      const mockError = new Error("FFmpeg error");
      onErrorCallback(mockError, "stdout", "stderr");

      await expect(executionPromise).rejects.toThrow("FFmpeg error");
      expect(mockLogService.error).toHaveBeenCalledWith(expect.stringContaining("FFmpeg error"));
    });

    it("should handle progress updates correctly", async () => {
      const progressCallback = jest.fn();
      let onProgressCallback: any;
      let onEndCallback: any;

      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "progress") {
          onProgressCallback = callback;
        } else if (event === "end") {
          onEndCallback = callback;
        }
        return mockCommand;
      });

      const executionPromise = ffmpegExecutionService.executeFFmpegCommand(
        mockCommand,
        mockOutputPath,
        mockTotalDuration,
        mockStoryId,
        progressCallback
      );

      onProgressCallback({
        timemark: "00:00:15.00",
        frames: 375,
        currentFps: 25,
        currentKbps: 2000,
      });
      expect(progressCallback).toHaveBeenCalledWith(50);

      onProgressCallback({ frames: 750, currentFps: 25, currentKbps: 2000 });
      expect(progressCallback).toHaveBeenCalledWith(100);

      onEndCallback();

      await executionPromise;
      expect(mockLogService.debug).toHaveBeenCalledWith(expect.stringContaining("FFmpeg progress"));
    });

    it("should handle stderr output", async () => {
      const progressCallback = jest.fn();
      let onStderrCallback: any;
      let onEndCallback: any;

      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "stderr") {
          onStderrCallback = callback;
        } else if (event === "end") {
          onEndCallback = callback;
        }
        return mockCommand;
      });

      const executionPromise = ffmpegExecutionService.executeFFmpegCommand(
        mockCommand,
        mockOutputPath,
        mockTotalDuration,
        mockStoryId,
        progressCallback
      );

      onStderrCallback("Warning: Some warning message");
      onStderrCallback("Error: Some error message");

      onEndCallback();

      await executionPromise;
      expect(mockLogService.warn).toHaveBeenCalledWith(
        expect.stringContaining("Some error message")
      );
    });
  });

  describe("buildCodecOutputOptions", () => {
    it("should build default output options correctly", () => {
      const videoSettings = {};
      const audioSettings = {};

      const options = ffmpegExecutionService["buildCodecOutputOptions"](
        videoSettings,
        audioSettings
      );

      expect(options).toContain("-c:v");
      expect(options).toContain("libx264");
      expect(options).toContain("-pix_fmt");
      expect(options).toContain("yuv420p");
      expect(options).toContain("-r");
      expect(options).toContain("25");
      expect(options).toContain("-c:a");
      expect(options).toContain("aac");
      expect(options).toContain("-b:a");
      expect(options).toContain("128k");
      expect(options).toContain("-ac");
      expect(options).toContain("2");
      expect(options).toContain("-ar");
      expect(options).toContain("44100");
      expect(options).toContain("-movflags");
      expect(options).toContain("+faststart");
    });

    it("should build output options with custom video settings", () => {
      const videoSettings = {
        codec: "prores_ks",
        fps: 30,
        bitrate: "2000k",
        quality: "high",
        resolution: "1920x1080",
        pixel_format: "yuva420p",
      };
      const audioSettings = {};

      const options = ffmpegExecutionService["buildCodecOutputOptions"](
        videoSettings,
        audioSettings
      );

      expect(options).toContain("-c:v");
      expect(options).toContain("prores_ks");
      expect(options).toContain("-pix_fmt");
      expect(options).toContain("yuva420p");
      expect(options).toContain("-r");
      expect(options).toContain("30");
      expect(options).toContain("-b:v");
      expect(options).toContain("2000k");
    });

    it("should build output options with custom audio settings", () => {
      const videoSettings = {};
      const audioSettings = {
        codec: "mp3",
        bitrate: "192k",
        channels: 1,
        normalization: true,
        sample_rate: 48000,
      };

      const options = ffmpegExecutionService["buildCodecOutputOptions"](
        videoSettings,
        audioSettings
      );

      expect(options).toContain("-c:a");
      expect(options).toContain("mp3");
      expect(options).toContain("-b:a");
      expect(options).toContain("192k");
      expect(options).toContain("-ac");
      expect(options).toContain("1");
      expect(options).toContain("-ar");
      expect(options).toContain("48000");
    });

    it("should handle alpha format correctly", () => {
      const videoSettings = {
        codec: "libvpx",
        pixel_format: "yuva420p",
      };
      const audioSettings = {};

      const options = ffmpegExecutionService["buildCodecOutputOptions"](
        videoSettings,
        audioSettings
      );

      expect(options).not.toContain("-movflags");
      expect(options).not.toContain("+faststart");
    });
  });
});
