import { LayoutService } from "@/domain/video/layout.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { VideoLayoutRepository } from "@/domain/layout/video-layout.repository";
import { defaultLayout } from "@/domain/layout/defaultLayout";
import {
  LayoutItem,
  ImageLayoutItem,
  TextLayoutItem,
} from "@/domain/video/types/video-layout.types";

jest.mock("@/domain/layout/defaultLayout", () => ({
  defaultLayout: [
    {
      type: "image" as const,
      width: 800,
      height: 450,
      position: { x: 0, y: 0 },
    },
    {
      type: "text" as const,
      color: "#000000",
      backgroundColor: "#ffffff",
      fontSize: 24,
      position: { x: 50, y: 50 },
      width: 700,
      height: 350,
      fontFamily: undefined,
      box: undefined,
      boxColor: undefined,
      boxBorderW: undefined,
      lineSpacing: undefined,
    },
  ],
}));

describe("LayoutService", () => {
  let layoutService: LayoutService;
  let mockLogService: jest.Mocked<LogService>;
  let mockVideoLayoutRepository: jest.Mocked<VideoLayoutRepository>;

  beforeEach(() => {
    mockLogService = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockVideoLayoutRepository = {
      getLayout: jest.fn(),
    } as any;

    layoutService = new LayoutService(mockLogService, mockVideoLayoutRepository);
    jest.clearAllMocks();
  });

  describe("prepareLayout", () => {
    it("should throw error when story has no pages", async () => {
      const story = {
        id: 1,
        settings: {},
        pages: [],
      };

      await expect(layoutService.prepareLayout(story)).rejects.toThrow("Story 1 has no pages.");
    });

    it("should use default layout when no layout ID is provided", async () => {
      const story = {
        id: 1,
        settings: {},
        pages: [{ content: "Page 1" }],
      };

      const result = await layoutService.prepareLayout(story);

      expect(result).toEqual(defaultLayout);
      expect(mockLogService.info).toHaveBeenCalledWith(
        "[Story 1] No layout ID found. Using default layout."
      );
    });

    it("should use default layout when layout is not found in database", async () => {
      const story = {
        id: 1,
        settings: { layout: { id: "non-existent" } },
        pages: [{ content: "Page 1" }],
      };

      mockVideoLayoutRepository.getLayout.mockResolvedValue(null);

      const result = await layoutService.prepareLayout(story);

      expect(result).toEqual(defaultLayout);
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[Story 1] Layout non-existent not found or empty. Using default."
      );
    });

    it("should use default layout when database layout is empty", async () => {
      const story = {
        id: 1,
        settings: { layout: { id: "empty-layout" } },
        pages: [{ content: "Page 1" }],
      };

      mockVideoLayoutRepository.getLayout.mockResolvedValue({
        id: "empty-layout",
        name: "Empty Layout",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await layoutService.prepareLayout(story);

      expect(result).toEqual(defaultLayout);
      expect(mockLogService.warn).toHaveBeenCalledWith(
        "[Story 1] Layout empty-layout resulted in empty layout. Using default."
      );
    });

    it("should use default layout when database error occurs", async () => {
      const story = {
        id: 1,
        settings: { layout: { id: "error-layout" } },
        pages: [{ content: "Page 1" }],
      };

      mockVideoLayoutRepository.getLayout.mockRejectedValue(new Error("Database error"));

      const result = await layoutService.prepareLayout(story);

      expect(result).toEqual(defaultLayout);
      expect(mockLogService.error).toHaveBeenCalledWith(
        "[Story 1] Failed to fetch layout: Database error. Using default."
      );
    });

    it("should successfully load and parse layout from database", async () => {
      const story = {
        id: 1,
        settings: { layout: { id: "valid-layout" } },
        pages: [{ content: "Page 1" }],
      };

      const dbLayout = {
        id: "valid-layout",
        name: "Valid Layout",
        items: JSON.stringify([
          {
            type: "image" as const,
            width: 800,
            height: 450,
            position: { x: 0, y: 0 },
          },
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVideoLayoutRepository.getLayout.mockResolvedValue(dbLayout);

      const result = await layoutService.prepareLayout(story);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "image",
        width: 800,
        height: 450,
        position: { x: 0, y: 0 },
      });
    });
  });

  describe("mapLayoutItems", () => {
    it("should return empty array for non-array input", () => {
      const result = layoutService.mapLayoutItems([]);
      expect(result).toEqual([]);
    });

    it("should filter out invalid items", () => {
      const items = [
        null,
        undefined,
        { type: "unknown" },
        {
          type: "image",
          width: "invalid",
          height: 450,
          position: { x: 0, y: 0 },
        },
        {
          type: "text",
          color: 123,
          fontSize: 24,
          position: { x: 0, y: 0 },
          width: 100,
          height: 100,
        },
      ];

      const result = layoutService.mapLayoutItems(items);

      expect(result).toHaveLength(0);
      expect(mockLogService.warn).toHaveBeenCalledWith("[Layout] Unknown item type: unknown");
      expect(mockLogService.warn).toHaveBeenCalledWith(
        '[Layout] Invalid image dimensions: {"type":"image","width":"invalid","height":450,"position":{"x":0,"y":0}}'
      );
      expect(mockLogService.warn).toHaveBeenCalledWith(
        '[Layout] Invalid text properties: {"type":"text","color":123,"fontSize":24,"position":{"x":0,"y":0},"width":100,"height":100}'
      );
    });

    it("should correctly map valid image items", () => {
      const items: Partial<ImageLayoutItem>[] = [
        {
          type: "image",
          width: 800,
          height: 450,
          position: { x: 0, y: 0 },
        },
      ];

      const result = layoutService.mapLayoutItems(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "image",
        width: 800,
        height: 450,
        position: { x: 0, y: 0 },
      });
    });

    it("should correctly map valid text items", () => {
      const items: Partial<TextLayoutItem>[] = [
        {
          type: "text",
          color: "#000000",
          backgroundColor: "#ffffff",
          fontSize: 24,
          position: { x: 50, y: 50 },
          width: 700,
          height: 350,
          fontFamily: "Arial",
          box: true,
          boxColor: "#ffffff",
          boxBorderW: 2,
          lineSpacing: 1.5,
        },
      ];

      const result = layoutService.mapLayoutItems(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        color: "#000000",
        backgroundColor: "#ffffff",
        fontSize: 24,
        position: { x: 50, y: 50 },
        width: 700,
        height: 350,
        fontFamily: "Arial",
        box: true,
        boxColor: "#ffffff",
        boxBorderW: 2,
        lineSpacing: 1.5,
      });
    });
  });

  describe("prepareScaledLayout", () => {
    it("should scale layout items correctly", () => {
      const originalLayout: LayoutItem[] = [
        {
          type: "image",
          width: 800,
          height: 450,
          position: { x: 0, y: 0 },
        },
        {
          type: "text",
          color: "#000000",
          backgroundColor: "#ffffff",
          fontSize: 24,
          position: { x: 50, y: 50 },
          width: 700,
          height: 350,
          boxBorderW: 2,
          lineSpacing: 1.5,
        },
      ];

      const result = layoutService.prepareScaledLayout(originalLayout, 1600, 900);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "image",
        width: 1600,
        height: 900,
        position: { x: 0, y: 0 },
      });
      expect(result[1]).toEqual({
        type: "text",
        color: "#000000",
        backgroundColor: "#ffffff",
        fontSize: 48,
        position: { x: 100, y: 100 },
        width: 1400,
        height: 700,
        boxBorderW: 4,
        lineSpacing: 3,
      });
    });

    it("should handle empty layout", () => {
      const result = layoutService.prepareScaledLayout([], 1600, 900);
      expect(result).toEqual([]);
    });
  });
});
