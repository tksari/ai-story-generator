import { TextProcessingService } from "@/domain/video/text-processing.service";
import { createCanvas } from "canvas";

jest.mock("canvas", () => ({
  createCanvas: jest.fn().mockImplementation(() => ({
    getContext: jest.fn().mockReturnValue({
      font: "",
      measureText: jest.fn().mockReturnValue({ width: 100 }),
    }),
  })),
}));

describe("TextProcessingService", () => {
  let textProcessingService: TextProcessingService;
  let mockContext: any;

  beforeEach(() => {
    textProcessingService = new TextProcessingService();
    mockContext = {
      font: "",
      measureText: jest.fn().mockReturnValue({ width: 100 }),
    };
    (createCanvas as jest.Mock).mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue(mockContext),
    }));
    jest.clearAllMocks();
  });

  describe("measureTextWidth", () => {
    it("should measure text width with default font", () => {
      const text = "Test Text";
      const fontSize = 24;

      const width = textProcessingService.measureTextWidth(text, fontSize);

      expect(width).toBe(100);
      expect(mockContext.font).toBe("24px sans-serif");
      expect(mockContext.measureText).toHaveBeenCalledWith(text);
    });

    it("should measure text width with custom font", () => {
      const text = "Test Text";
      const fontSize = 24;
      const fontFamily = "Arial";

      const width = textProcessingService.measureTextWidth(text, fontSize, fontFamily);

      expect(width).toBe(100);
      expect(mockContext.font).toBe("24px Arial");
      expect(mockContext.measureText).toHaveBeenCalledWith(text);
    });
  });

  describe("wrapText", () => {
    const mockLayoutItem = {
      type: "text" as const,
      color: "#000000",
      backgroundColor: "#ffffff",
      fontSize: 24,
      position: { x: 0, y: 0 },
      width: 500,
      height: 200,
      fontFamily: "Arial",
    };

    beforeEach(() => {
      mockContext.measureText.mockImplementation((text: string) => ({
        width: text.length * 10,
      }));
    });

    it("should return original text if width is invalid", () => {
      const text = "Test Text";
      const invalidLayout = { ...mockLayoutItem, width: 0 };

      const result = textProcessingService.wrapText(text, invalidLayout);

      expect(result).toBe(text);
    });

    it("should return original text if text is empty", () => {
      const text = "";
      const result = textProcessingService.wrapText(text, mockLayoutItem);
      expect(result).toBe("");
    });

    it("should wrap text when it exceeds max width", () => {
      const text = "This is a very long text that needs to be wrapped into multiple lines";
      mockContext.measureText.mockImplementation((text: string) => ({
        width: text.length * 20,
      }));

      const result = textProcessingService.wrapText(text, mockLayoutItem);

      expect(result).toContain("\n");
      expect(result.split("\n").length).toBeGreaterThan(1);
    });

    it("should handle single word that exceeds max width", () => {
      const text = "Supercalifragilisticexpialidocious";
      mockContext.measureText.mockImplementation((text: string) => ({
        width: text.length * 30,
      }));

      const result = textProcessingService.wrapText(text, mockLayoutItem);

      expect(result).toContain("\n");
      expect(result.split("\n").length).toBeGreaterThan(1);
    });

    it("should not wrap text when it fits within width", () => {
      const text = "Short text";
      mockContext.measureText.mockImplementation((text: string) => ({
        width: text.length * 5,
      }));

      const result = textProcessingService.wrapText(text, mockLayoutItem);

      expect(result).toBe(text);
      expect(result).not.toContain("\n");
    });
  });

  describe("calculateTextBlockHeight", () => {
    it("should return 0 for empty lines", () => {
      const height = textProcessingService.calculateTextBlockHeight([], 24);
      expect(height).toBe(0);
    });

    it("should calculate height for single line", () => {
      const height = textProcessingService.calculateTextBlockHeight(["Single line"], 24);
      expect(height).toBe(29);
    });

    it("should calculate height for multiple lines with default spacing", () => {
      const height = textProcessingService.calculateTextBlockHeight(
        ["Line 1", "Line 2", "Line 3"],
        24
      );
      expect(height).toBe(87);
    });

    it("should calculate height for multiple lines with custom spacing", () => {
      const height = textProcessingService.calculateTextBlockHeight(
        ["Line 1", "Line 2", "Line 3"],
        24,
        12
      );
      expect(height).toBe(111);
    });

    it("should handle zero or negative line spacing", () => {
      const height = textProcessingService.calculateTextBlockHeight(["Line 1", "Line 2"], 24, -5);
      expect(height).toBe(53);
    });
  });

  describe("escapeFFmpegText", () => {
    it("should return empty string for empty input", () => {
      const result = textProcessingService.escapeFFmpegText("");
      expect(result).toBe("");
    });

    it("should escape special characters", () => {
      const text = "Text with special chars: \\ ' \" % : , [ ] = ; #";
      const result = textProcessingService.escapeFFmpegText(text);

      expect(result).toBe(
        "Text with special chars\\\\\\: \\\\\\\\ '\\\\\\'' \\\\\\\" \\\\\\% \\\\\\: \\\\\\, \\\\\\[ \\\\\\] \\\\\\= \\\\\\; \\\\\\#"
      );
    });

    it("should handle newlines", () => {
      const text = "Line 1\nLine 2\r\nLine 3\rLine 4";
      const result = textProcessingService.escapeFFmpegText(text);

      expect(result).toBe("Line 1\\\nLine 2\\\nLine 3\\\nLine 4");
    });

    it("should handle multiple special characters in sequence", () => {
      const text = "\\'\"%%::,,";
      const result = textProcessingService.escapeFFmpegText(text);

      expect(result).toBe("\\\\\\\\'\\\\\\''\\\\\\\"\\\\\\%\\\\\\%\\\\\\:\\\\\\:\\\\\\,\\\\\\,");
    });
  });
});
