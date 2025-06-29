import { FilterConstructionService } from "@/domain/video/filter-construction.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { TextProcessingService } from "@/domain/video/text-processing.service";
import { DurationService } from "@/domain/video/duration.service";

jest.mock("@/infrastructure/logging/log.service");
jest.mock("@/domain/video/text-processing.service");
jest.mock("@/domain/video/duration.service");

describe("FilterConstructionService", () => {
  let filterConstructionService: FilterConstructionService;
  let mockLogService: jest.Mocked<LogService>;
  let mockTextProcessingService: jest.Mocked<TextProcessingService>;
  let mockDurationService: jest.Mocked<DurationService>;

  const mockPages = [
    { pageNumber: 1, content: "Test content 1" },
    { pageNumber: 2, content: "Test content 2" },
  ];

  const mockLayout = [
    {
      type: "text" as const,
      color: "#000000",
      backgroundColor: "#ffffff",
      fontSize: 24,
      position: { x: 0, y: 0 },
      width: 500,
      height: 200,
    },
    {
      type: "image" as const,
      width: 400,
      height: 300,
      position: { x: 50, y: 50 },
    },
  ];

  const mockSettings = {
    video: {
      resolution: "1280x720",
      fps: 30,
      codec: "h264",
    },
    audio: {
      codec: "aac",
      bitrate: "192k",
      channels: 2,
    },
    background: {
      type: "color",
      color: "#FFFFFF",
    },
  };

  beforeEach(() => {
    mockLogService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockTextProcessingService = {
      wrapText: jest.fn().mockImplementation((text) => text),
      escapeFFmpegText: jest.fn().mockImplementation((text) => text),
      calculateTextBlockHeight: jest.fn().mockReturnValue(100),
    } as any;

    mockDurationService = {
      calculateStartTime: jest.fn().mockImplementation((durations, index) => index * 5),
    } as any;

    filterConstructionService = new FilterConstructionService(
      mockLogService,
      mockTextProcessingService,
      mockDurationService
    );
  });

  describe("buildComplexFilterString", () => {
    it("should build complete filter string with video and audio", () => {
      const pageDurations = ["5", "5"];
      const totalDuration = 10;
      const mediaInputMap = {
        0: { image: 0, speech: 1 },
        1: { image: 2, speech: 3 },
      };

      const result = filterConstructionService.buildComplexFilterString(
        mockPages,
        mockLayout,
        mockSettings,
        pageDurations,
        totalDuration,
        mediaInputMap
      );

      expect(result.filterString).toContain("color=c=0xFFFFFF");
      expect(result.filterString).toContain("scale=");
      expect(result.filterString).toContain("overlay=");
      expect(result.filterString).toContain("drawtext=");
      expect(result.filterString).toContain("adelay=");
      expect(result.filterString).toContain("amix=");
      expect(result.finalVideoLabel).toBeDefined();
      expect(result.finalAudioLabel).toBe("[aout]");
    });

    it("should handle pages without audio", () => {
      const pageDurations = ["5", "5"];
      const totalDuration = 10;
      const mediaInputMap = {
        0: { image: 0 },
        1: { image: 2 },
      };

      const result = filterConstructionService.buildComplexFilterString(
        mockPages,
        mockLayout,
        mockSettings,
        pageDurations,
        totalDuration,
        mediaInputMap
      );

      expect(result.filterString).toContain("anullsrc=");
      expect(result.finalAudioLabel).toContain("audio_src");
    });

    it("should scale layout items according to output resolution", () => {
      const pageDurations = ["5"];
      const totalDuration = 5;
      const mediaInputMap = { 0: { image: 0 } };
      const customSettings = {
        ...mockSettings,
        video: { ...mockSettings.video, resolution: "1920x1080" },
      };

      const result = filterConstructionService.buildComplexFilterString(
        [mockPages[0]],
        mockLayout,
        customSettings,
        pageDurations,
        totalDuration,
        mediaInputMap
      );

      expect(result.filterString).toContain("scale=");
      expect(result.filterString).toContain("1920x1080");
    });
  });

  describe("buildBackgroundFilter", () => {
    it("should create color background filter", () => {
      const settings = {
        background: {
          type: "color",
          color: "#FF0000",
        },
      };

      const result = (filterConstructionService as any).buildBackgroundFilter(
        settings,
        "1280x720",
        10,
        "[bg]"
      );

      expect(result).toContain("color=c=0xFF0000");
      expect(result).toContain("s=1280x720");
      expect(result).toContain("d=10");
    });

    it("should create image background filter", () => {
      const settings = {
        background: {
          type: "image",
          image: "/path/to/image.jpg",
          fit: "cover",
          opacity: 80,
        },
      };

      const result = (filterConstructionService as any).buildBackgroundFilter(
        settings,
        "1280x720",
        10,
        "[bg]"
      );

      expect(result).toContain("movie=");
      expect(result).toContain("scale=");
      expect(result).toContain("colorchannelmixer=aa=0.8");
    });

    it("should use default black background when no settings provided", () => {
      const result = (filterConstructionService as any).buildBackgroundFilter(
        {},
        "1280x720",
        10,
        "[bg]"
      );

      expect(result).toContain("color=c=black");
      expect(result).toContain("s=1280x720");
      expect(result).toContain("d=10");
    });
  });

  describe("createTextLayoutFilter", () => {
    it("should create text filter with all options", () => {
      const textLayout = {
        type: "text" as const,
        color: "#000000",
        fontSize: 24,
        position: { x: 100, y: 100 },
        width: 500,
        height: 200,
        fontFamily: "arial",
        box: true,
        boxColor: "black@0.5",
        boxBorderW: 2,
        lineSpacing: 10,
      };

      const result = (filterConstructionService as any).createTextLayoutFilter(
        "Test Text",
        "[0:v]",
        textLayout,
        ":enable='between(t,0,5)'",
        "[text]"
      );

      expect(result).toContain("drawtext=");
      expect(result).toContain("text='Test Text'");
      expect(result).toContain("x=100:y=");
      expect(result).toContain("fontsize=24");
      expect(result).toContain("fontcolor=0x000000");
      expect(result).toContain("box=1");
      expect(result).toContain("boxcolor=undefined");
      expect(result).toContain("boxborderw=2");
      expect(result).toContain("line_spacing=10");
    });
  });

  describe("createAudioMixFilter", () => {
    it("should create audio mix filter for multiple inputs", () => {
      const audioSegments = ["[0:a]adelay=0|0[a0]", "[1:a]adelay=5000|5000[a1]"];

      const result = (filterConstructionService as any).createAudioMixFilter(
        mockPages,
        audioSegments
      );

      expect(result).toContain("[a0][a1]amix=");
      expect(result).toContain("inputs=2");
      expect(result).toContain("duration=longest");
    });
  });

  describe("parseColor", () => {
    it("should parse hex colors", () => {
      const result = (filterConstructionService as any).parseColor("#FF0000");
      expect(result).toBe("0xFF0000");
    });

    it("should parse rgba colors", () => {
      const result = (filterConstructionService as any).parseColor("rgba(255, 0, 0, 0.5)");
      expect(result).toBe("0xff0000@0.50");
    });

    it("should handle invalid colors", () => {
      const result = (filterConstructionService as any).parseColor("invalid");
      expect(result).toBe("invalid");
    });
  });

  describe("escapeFilterValue", () => {
    it("should escape special characters", () => {
      const result = (filterConstructionService as any).escapeFilterValue(
        "test:path\\with'special[chars]"
      );
      expect(result).toContain("\\\\");
      expect(result).toContain("\\:");
      expect(result).toContain("\\[");
      expect(result).toContain("\\]");
    });

    it("should handle empty input", () => {
      const result = (filterConstructionService as any).escapeFilterValue("");
      expect(result).toBe("");
    });
  });
});
