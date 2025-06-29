import { InputPreparationService } from "@/domain/video/input-preparation.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { GeneratedImage, GeneratedSpeech } from "@prisma/client";
import { Readable } from "stream";

jest.mock("fluent-ffmpeg", () => {
  return jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
  }));
});

describe("InputPreparationService", () => {
  let inputPreparationService: InputPreparationService;
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
      input: jest.fn().mockReturnThis(),
    };

    inputPreparationService = new InputPreparationService(mockLogService);
    jest.clearAllMocks();
  });

  describe("setupInputs", () => {
    it("should setup inputs for pages with both image and speech", () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedImages: [{ path: "image1.jpg" } as GeneratedImage],
          generatedSpeeches: [{ path: "speech1.mp3" } as GeneratedSpeech],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedImages: [{ path: "image2.jpg" } as GeneratedImage],
          generatedSpeeches: [{ path: "speech2.mp3" } as GeneratedSpeech],
        },
      ];

      const result = inputPreparationService.setupInputs(mockCommand, pages);

      expect(mockCommand.input).toHaveBeenCalledTimes(4);
      expect(mockCommand.input).toHaveBeenCalledWith("image1.jpg");
      expect(mockCommand.input).toHaveBeenCalledWith("speech1.mp3");
      expect(mockCommand.input).toHaveBeenCalledWith("image2.jpg");
      expect(mockCommand.input).toHaveBeenCalledWith("speech2.mp3");

      expect(result).toEqual({
        0: { image: 0, speech: 1 },
        1: { image: 2, speech: 3 },
      });
    });

    it("should handle pages with missing media", () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedImages: [{ path: "image1.jpg" } as GeneratedImage],
          generatedSpeeches: [],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedImages: [],
          generatedSpeeches: [{ path: "speech2.mp3" } as GeneratedSpeech],
        },
      ];

      const result = inputPreparationService.setupInputs(mockCommand, pages);

      expect(mockCommand.input).toHaveBeenCalledTimes(2);
      expect(mockCommand.input).toHaveBeenCalledWith("image1.jpg");
      expect(mockCommand.input).toHaveBeenCalledWith("speech2.mp3");
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped speech for page 0: file missing"
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped image for page 1: file missing"
      );

      expect(result).toEqual({
        0: { image: 0 },
        1: { speech: 1 },
      });
    });

    it("should handle empty pages array", () => {
      const result = inputPreparationService.setupInputs(mockCommand, []);

      expect(mockCommand.input).toHaveBeenCalledTimes(1);
      expect(mockCommand.input).toHaveBeenCalledWith(expect.any(Readable));
      expect(mockLogService.info).toHaveBeenCalledWith(
        "[MediaInput] No media inputs found. Adding a dummy PNG stream to prevent fluent-ffmpeg error."
      );
      expect(result).toEqual({});
    });

    it("should handle pages with undefined media arrays", () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedSpeeches: [],
          generatedImages: [],
        },
        {
          pageNumber: 2,
          content: "Page 2",
          generatedSpeeches: [],
          generatedImages: [],
        },
      ];

      const result = inputPreparationService.setupInputs(mockCommand, pages);

      expect(mockCommand.input).toHaveBeenCalledTimes(1);
      expect(mockCommand.input).toHaveBeenCalledWith(expect.any(Readable));
      expect(mockLogService.info).toHaveBeenCalledWith(
        "[MediaInput] No media inputs found. Adding a dummy PNG stream to prevent fluent-ffmpeg error."
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped image for page 0: file missing"
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped speech for page 0: file missing"
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped image for page 1: file missing"
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[MediaInput] Skipped speech for page 1: file missing"
      );

      expect(result).toEqual({});
    });
  });

  describe("getMediaInputMap", () => {
    it("should return the current media input map", () => {
      const pages = [
        {
          pageNumber: 1,
          content: "Page 1",
          generatedImages: [{ path: "image1.jpg" } as GeneratedImage],
          generatedSpeeches: [{ path: "speech1.mp3" } as GeneratedSpeech],
        },
      ];

      inputPreparationService.setupInputs(mockCommand, pages);
      const result = inputPreparationService.getMediaInputMap();

      expect(result).toEqual({
        0: { image: 0, speech: 1 },
      });
    });

    it("should return empty object when no inputs have been set up", () => {
      const result = inputPreparationService.getMediaInputMap();
      expect(result).toEqual({});
    });
  });
});
