import { inject, injectable } from "tsyringe";
import { LogService } from "@/infrastructure/logging/log.service";
import { TextProcessingService } from "./text-processing.service";
import { DurationService } from "./duration.service";
import {
  StoryPageData,
  StorySettings,
  ComplexFilterResult,
  AudioCodecSettings,
  PageFilterSegmentResult,
} from "@/domain/video/types/video.types";
import {
  LayoutItem,
  ImageLayoutItem,
  TextLayoutItem,
  LayoutPosition,
} from "@/domain/video/types/video-layout.types";

@injectable()
export class FilterConstructionService {
  private readonly REFERENCE_CANVAS_WIDTH = 800;
  private readonly REFERENCE_CANVAS_HEIGHT = 450;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("TextProcessingService")
    private textProcessingService: TextProcessingService,
    @inject("DurationService") private durationService: DurationService
  ) {}

  buildComplexFilterString(
    pages: StoryPageData[],
    originalLayout: LayoutItem[],
    settings: StorySettings,
    pageDurations: string[],
    totalDuration: number,
    mediaInputMap: Record<number, { image?: number; speech?: number }>
  ): ComplexFilterResult {
    const videoSettings = settings.video || {};
    const audioSettings = settings.audio || {};
    const outputResolutionString = videoSettings.resolution || "1280x720";
    const [outputWidth, outputHeight] = outputResolutionString.split("x").map(Number);

    const scaledLayout = this.prepareScaledLayout(originalLayout, outputWidth, outputHeight);
    const filterSegments: string[] = [];

    const bgLabel = "[canvas]";
    filterSegments.push(
      this.buildBackgroundFilter(settings, outputResolutionString, totalDuration, bgLabel)
    );

    const videoResult = this.buildVideoFilters(
      pages,
      scaledLayout,
      pageDurations,
      bgLabel,
      mediaInputMap
    );

    filterSegments.push(...videoResult.filterSegments);

    const audioResult = this.buildAudioFilters(
      pages,
      pageDurations,
      audioSettings,
      totalDuration,
      mediaInputMap
    );

    if (audioResult.hasAudio) {
      filterSegments.push(...audioResult.audioSegments);
      return {
        filterString: filterSegments.join(";"),
        finalVideoLabel: videoResult.finalLabel,
        finalAudioLabel: audioResult.audioLabel,
      };
    }

    filterSegments.push(audioResult.silentAudioFilter);
    return {
      filterString: filterSegments.join(";"),
      finalVideoLabel: videoResult.finalLabel,
      finalAudioLabel: audioResult.audioLabel,
    };
  }

  private prepareScaledLayout(
    originalLayout: LayoutItem[],
    outputWidth: number,
    outputHeight: number
  ): LayoutItem[] {
    return originalLayout.map((item) => this.scaleLayoutItem(item, outputWidth, outputHeight));
  }

  private scaleLayoutItem(item: LayoutItem, targetWidth: number, targetHeight: number): LayoutItem {
    const scaleX = targetWidth / this.REFERENCE_CANVAS_WIDTH;
    const scaleY = targetHeight / this.REFERENCE_CANVAS_HEIGHT;
    const generalScale = scaleY;

    const scaledPosition = {
      x: Math.round(item.position.x * scaleX),
      y: Math.round(item.position.y * scaleY),
    };

    if (item.type === "image") {
      return {
        ...item,
        width: Math.round(item.width * scaleX),
        height: Math.round(item.height * scaleY),
        position: scaledPosition,
      };
    }

    if (item.type === "text") {
      return {
        ...item,
        fontSize: Math.round(item.fontSize * generalScale),
        position: scaledPosition,
        width: Math.round(item.width * scaleX),
        height: Math.round(item.height * scaleY),
        ...(item.boxBorderW && {
          boxBorderW: Math.round(item.boxBorderW * generalScale),
        }),
        ...(item.lineSpacing && {
          lineSpacing: Math.round(item.lineSpacing * generalScale),
        }),
      };
    }

    return item;
  }

  private buildVideoFilters(
    pages: StoryPageData[],
    scaledLayout: LayoutItem[],
    pageDurations: string[],
    bgLabel: string,
    mediaInputMap: Record<number, { image?: number; speech?: number }>
  ): { filterSegments: string[]; finalLabel: string } {
    const filterSegments: string[] = [];
    let currentStreamLabel = bgLabel;

    pages
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .forEach((page, index) => {
        this.logService.debug(
          `[Filter Build] Processing page ${index} (PageNum: ${page.pageNumber}), input stream: ${currentStreamLabel}`
        );

        const startTime = this.durationService.calculateStartTime(pageDurations, index);
        const duration = parseFloat(pageDurations[index]);

        const pageResult = this.buildPageFilterSegment(
          page,
          index,
          scaledLayout,
          currentStreamLabel,
          startTime,
          duration,
          mediaInputMap
        );

        if (pageResult.segmentString) {
          filterSegments.push(pageResult.segmentString);
          currentStreamLabel = pageResult.outputLabel;
          this.logService.debug(
            `[Filter Build] Page ${index} segment added. Output stream: ${currentStreamLabel}`
          );
        } else {
          this.logService.warn(
            `[Filter Build] Page ${index} (PageNum: ${page.pageNumber}) generated empty filter segment. Passing through ${currentStreamLabel}.`
          );
        }
      });

    return { filterSegments, finalLabel: currentStreamLabel };
  }

  private buildPageFilterSegment(
    page: StoryPageData,
    index: number,
    layout: LayoutItem[],
    baseStreamLabel: string,
    startTime: number,
    duration: number,
    mediaInputMap: Record<number, { image?: number; speech?: number }>
  ): PageFilterSegmentResult {
    const media = mediaInputMap?.[index];
    const pageFilterParts: string[] = [];
    let currentSegmentStreamLabel = baseStreamLabel;
    const endTime = startTime + duration;

    this.logService.debug(
      `[Page ${index}] Start: ${startTime}s, End: ${endTime}s, Duration: ${duration}s`
    );

    const timeEnable = `:enable='between(t,${startTime},${endTime})'`;
    const imageLayoutItem = layout.find((item) => item.type === "image");
    const textLayoutItem = layout.find((item) => item.type === "text");

    if (imageLayoutItem && media?.image !== undefined) {
      const imageStream = `[${media.image}:v]`;
      const scaledLabel = `[p${index}_scaled]`;
      const overlayLabel = `[p${index}_img_ovr]`;

      pageFilterParts.push(
        `${imageStream}scale=${imageLayoutItem.width}:${imageLayoutItem.height}${scaledLabel}`
      );
      pageFilterParts.push(
        this.createOverlayFilter(
          currentSegmentStreamLabel,
          scaledLabel,
          imageLayoutItem.position,
          timeEnable,
          overlayLabel
        )
      );
      currentSegmentStreamLabel = overlayLabel;
      this.logService.debug(
        `[Page ${index} Filter] Added scale/overlay. Stream: ${currentSegmentStreamLabel}`
      );
    }

    if (textLayoutItem) {
      const textLabel = `[p${index}_txt_out]`;
      pageFilterParts.push(
        this.createTextLayoutFilter(
          page.content,
          currentSegmentStreamLabel,
          textLayoutItem,
          timeEnable,
          textLabel
        )
      );
      currentSegmentStreamLabel = textLabel;
      this.logService.debug(
        `[Page ${index} Filter] Added drawtext. Stream: ${currentSegmentStreamLabel}`
      );
    }

    if (pageFilterParts.length === 0) return { segmentString: "", outputLabel: baseStreamLabel };

    const segmentString = pageFilterParts.join(",");
    return {
      segmentString: segmentString,
      outputLabel: currentSegmentStreamLabel,
    };
  }

  private buildAudioFilters(
    pages: StoryPageData[],
    pageDurations: string[],
    audioSettings: AudioCodecSettings,
    totalDuration: number,
    mediaInputMap: Record<number, { image?: number; speech?: number }>
  ): {
    hasAudio: boolean;
    audioSegments: string[];
    audioLabel: string;
    silentAudioFilter: string;
  } {
    const audioSegments: string[] = [];
    let hasAudio = false;

    for (let i = 0; i < pages.length; i++) {
      const media = mediaInputMap?.[i];
      if (media?.speech !== undefined) {
        const startTime = this.durationService.calculateStartTime(pageDurations, i);
        audioSegments.push(
          `[${media.speech}:a]adelay=${startTime * 1000}|${startTime * 1000}[a${i}]`
        );
        hasAudio = true;
      }
    }

    if (hasAudio) {
      const mixFilter = this.createAudioMixFilter(pages, audioSegments);
      audioSegments.push(mixFilter);

      this.logService.debug(`[Filter Build] Audio mix filter added.`);
      return {
        hasAudio: true,
        audioSegments,
        audioLabel: "[aout]",
        silentAudioFilter: "",
      };
    }

    const audioLabel = "audio_src";
    const silentAudioFilter = this.createAudioSourceFilter(
      audioSettings,
      totalDuration,
      audioLabel
    );
    this.logService.debug(`[Filter Build] No audio found. Silent audio source filter created.`);

    return {
      hasAudio: false,
      audioSegments: [],
      audioLabel: `[${audioLabel}]`,
      silentAudioFilter,
    };
  }

  private createAudioMixFilter(pages: StoryPageData[], audioSegments: string[]): string {
    const audioLabels = pages
      .map((_, i) => (audioSegments.some((seg) => seg.includes(`[a${i}]`)) ? `[a${i}]` : ""))
      .filter((label) => label);

    return `${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest[aout]`;
  }

  private createAudioSourceFilter(
    audioSettings: AudioCodecSettings,
    duration: number,
    outputLabelWithoutBrackets: string
  ): string {
    const sampleRate = audioSettings.sample_rate || 44100;
    const channels = audioSettings.channels || 2;
    const channelLayout = channels === 1 ? "mono" : "stereo";
    return `anullsrc=channel_layout=${channelLayout}:sample_rate=${sampleRate}:d=${duration}[${outputLabelWithoutBrackets}]`;
  }

  private createOverlayFilter(
    baseStream: string,
    overlayStream: string,
    position: LayoutPosition,
    timeEnable: string,
    outputLabel: string
  ): string {
    return `${baseStream}${overlayStream}overlay=x=${position.x}:y=${position.y}${timeEnable}${outputLabel}`;
  }

  private buildBackgroundFilter(
    settings: any,
    resolution: string,
    duration: number,
    outputLabel: string
  ): string {
    const [width, height] = resolution.split("x").map(Number);
    const background = settings?.background;

    const type = background?.type || "color";
    const opacity = (background?.opacity ?? 100) / 100;

    if (type === "color" && background?.color) {
      const parsed = this.parseColor(background.color);
      return `color=c=${parsed}:s=${resolution}:d=${duration},format=rgba${outputLabel}`;
    }

    if (type === "image" && background?.image) {
      const fitFilter = this.getImageFitFilter(background.fit || "cover", width, height);
      const filterChain = `movie='${this.escapeFilterValue(background.image)}',${fitFilter},format=rgba,colorchannelmixer=aa=${opacity}${outputLabel}`;
      return filterChain;
    }

    if (type === "gradient") {
      throw new Error("Not supported yet.");
    }

    return `color=c=black:s=${resolution}:d=${duration}${outputLabel}`;
  }

  private getImageFitFilter(fit: "cover" | "contain" | "fill", w: number, h: number): string {
    switch (fit) {
      case "cover":
        return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
      case "contain":
        return `scale=${w}:${h}:force_original_aspect_ratio=decrease`;
      case "fill":
      default:
        return `scale=${w}:${h}`;
    }
  }

  private createTextLayoutFilter(
    text: string,
    inputStream: string,
    layout: TextLayoutItem,
    timeEnable: string,
    outputLabel: string
  ): string {
    const {
      position,
      fontSize,
      color,
      backgroundColor,
      fontFamily,
      boxBorderW = 1,
      lineSpacing = 2,
      width,
      height,
    } = layout;
    const wrappedText = this.textProcessingService.wrapText(text, layout);
    const escapedText = this.textProcessingService.escapeFFmpegText(wrappedText);
    const fontColor = this.parseColor(color || "white");
    const fontFilePath = fontFamily ? this.resolveFontPath(fontFamily) : null;

    const textBlockActualHeight = this.textProcessingService.calculateTextBlockHeight(
      wrappedText.split("\n"),
      fontSize,
      lineSpacing
    );

    let finalYPosition = position.y;
    if (height && height > 0 && textBlockActualHeight > 0) {
      finalYPosition = position.y + Math.max(0, (height - textBlockActualHeight) / 2);
    }

    finalYPosition = Math.round(finalYPosition);

    this.logService.debug(
      `[Text Layout] Original Y: ${position.y}, Container H: ${height}, Text Block H: ${textBlockActualHeight}, Calculated Y: ${finalYPosition}`
    );

    const backgroundBoxColor = backgroundColor ? this.parseColor(backgroundColor) : undefined;

    const calculatedHeight = this.textProcessingService.calculateTextBlockHeight(
      wrappedText.split("\n"),
      fontSize,
      lineSpacing
    );

    const drawtextOptions =
      `text='${escapedText}'` +
      `:x=${position.x}:y=${finalYPosition}` +
      `:fontsize=${fontSize}:fontcolor=${fontColor}` +
      (fontFilePath ? `:fontfile='${this.escapeFilterValue(fontFilePath)}'` : "") +
      (lineSpacing ? `:line_spacing=${lineSpacing}` : "") +
      `:box=1` +
      `:boxcolor=${backgroundBoxColor}` +
      `:boxborderw=${boxBorderW || 0}` +
      `:text_align=left` +
      `:boxw=${width || this.REFERENCE_CANVAS_WIDTH}` +
      `:boxh=${calculatedHeight || this.REFERENCE_CANVAS_HEIGHT}`;

    return `${inputStream}drawtext=${drawtextOptions}${timeEnable}${outputLabel}`;
  }

  private parseColor(colorStr: string): string {
    if (!colorStr) return "white";
    colorStr = colorStr.trim();

    const rgbaMatch = colorStr.match(
      /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*([\d.]+))?\)$/i
    );
    if (rgbaMatch) {
      const [, r, g, b, a] = rgbaMatch;
      const hex = `0x${parseInt(r, 10).toString(16).padStart(2, "0")}${parseInt(g, 10).toString(16).padStart(2, "0")}${parseInt(b, 10).toString(16).padStart(2, "0")}`;
      const alpha = a !== undefined ? parseFloat(a) : 1.0;
      return alpha < 1.0 ? `${hex}@${alpha.toFixed(2)}` : hex;
    }

    const hexMatch = colorStr.match(/^#([a-fA-F0-9]{6})$|^#([a-fA-F0-9]{3})$/i);
    if (hexMatch) {
      let hexColor = hexMatch[1]; // #RRGGBB
      if (!hexColor) {
        const shortHex = hexMatch[2];
        hexColor = shortHex
          .split("")
          .map((char) => char + char)
          .join("");
      }
      return `0x${hexColor}`;
    }

    return colorStr;
  }

  private resolveFontPath(fontFamily: string): string | null {
    const fontMap: { [key: string]: string[] } = {
      arial: [
        "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
        "/usr/share/fonts/TTF/arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
      ],
      verdana: [
        "/usr/share/fonts/truetype/msttcorefonts/Verdana.ttf",
        "C:/Windows/Fonts/verdana.ttf",
        "/Library/Fonts/Verdana.ttf",
        "/System/Library/Fonts/Supplemental/Verdana.ttf",
      ],
    };

    const lowerFontFamily = fontFamily.toLowerCase().trim();
    const possiblePaths = fontMap[lowerFontFamily];

    if (possiblePaths) {
      this.logService.debug(
        `Providing potential font path for ${fontFamily} from map: ${possiblePaths[0]}`
      );
      return possiblePaths[0].replace(/\\/g, "/");
    }

    this.logService.warn(
      `No path found in map for font '${fontFamily}'. FFmpeg will attempt default lookup.`
    );
    return null;
  }

  private escapeFilterValue(value: string): string {
    if (!value) return "";
    return value
      .replace(/\\/g, "\\\\\\\\")
      .replace(/'/g, "'\\\\\\''")
      .replace(/:/g, "\\\\:")
      .replace(/\[/g, "\\\\\\[")
      .replace(/\]/g, "\\\\\\]");
  }
}
