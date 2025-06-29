import { injectable } from "tsyringe";
import { createCanvas } from "canvas";
import { TextLayoutItem } from "@/domain/video/types/video-layout.types";

@injectable()
export class TextProcessingService {
  measureTextWidth(text: string, fontSize: number, fontFamily?: string): number {
    const tempCanvasWidth = 200;
    const tempCanvasHeight = 50;
    const canvas = createCanvas(tempCanvasWidth, tempCanvasHeight);
    const context = canvas.getContext("2d");

    const fontStyle = `${fontSize}px ${fontFamily || "sans-serif"}`;
    context.font = fontStyle;

    return context.measureText(text).width;
  }

  wrapText(text: string, layoutItem: TextLayoutItem): string {
    const { width, fontSize, fontFamily } = layoutItem;
    const maxWidthPx = width - 120;

    if (!text || !width || width <= 0) {
      return text;
    }

    const words = text.split(/\s+/);
    let currentLine = "";
    const lines: string[] = [];

    for (const word of words) {
      if (this.measureTextWidth(word, fontSize, fontFamily) > maxWidthPx && currentLine === "") {
        const tempWord = word;
        let part = "";
        for (const char of tempWord) {
          if (this.measureTextWidth(part + char, fontSize, fontFamily) <= maxWidthPx) {
            part += char;
          } else {
            lines.push(part);
            part = char;
          }
        }
        if (part) lines.push(part);
        currentLine = "";
        continue;
      }

      const testLine = currentLine + (currentLine ? " " : "") + word;
      if (this.measureTextWidth(testLine, fontSize, fontFamily) > maxWidthPx) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join("\n");
  }

  calculateTextBlockHeight(lines: string[], fontSize: number, lineSpacing?: number): number {
    if (!lines || lines.length === 0) return 0;

    const numLines = lines.length;
    const effectiveLineSpacing = lineSpacing || 0;

    const heightPerLine = fontSize * 1.2;

    const totalTextHeight = numLines * heightPerLine + (numLines - 1) * effectiveLineSpacing;

    return Math.ceil(totalTextHeight);
  }

  escapeFFmpegText(text: string): string {
    if (!text) return "";
    return text
      .replace(/\\/g, "\\\\\\\\")
      .replace(/'/g, "'\\\\\\''")
      .replace(/"/g, '\\\\\\"')
      .replace(/%/g, "\\\\\\%")
      .replace(/:/g, "\\\\\\:")
      .replace(/,/g, "\\\\\\,")
      .replace(/\[/g, "\\\\\\[")
      .replace(/\]/g, "\\\\\\]")
      .replace(/=/g, "\\\\\\=")
      .replace(/;/g, "\\\\\\;")
      .replace(/#/g, "\\\\\\#")
      .replace(/\r\n|\r|\n/g, "\\\n");
  }
}
