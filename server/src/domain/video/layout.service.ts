import { inject, injectable } from "tsyringe";
import { LogService } from "@/infrastructure/logging/log.service";
import { VideoLayoutRepository } from "@/domain/layout/video-layout.repository";
import { defaultLayout } from "@/domain/layout/defaultLayout";
import {
  LayoutItem,
  StorySettings,
  StoryWithPages,
  ImageLayoutItem,
  TextLayoutItem,
} from "@/domain/video/types/video-layout.types";

@injectable()
export class LayoutService {
  private readonly REFERENCE_CANVAS_WIDTH = 800;
  private readonly REFERENCE_CANVAS_HEIGHT = 450;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("VideoLayoutRepository")
    private videoLayoutRepository: VideoLayoutRepository
  ) {}

  async prepareLayout(story: StoryWithPages): Promise<LayoutItem[]> {
    const storyId = story.id;
    this.logService.debug(`[Story ${storyId}] Preparing layout...`);

    if (!story.pages?.length) {
      throw new Error(`Story ${storyId} has no pages.`);
    }

    const layoutId = (story.settings as StorySettings)?.layout?.id;
    if (!layoutId) {
      this.logService.info(`[Story ${storyId}] No layout ID found. Using default layout.`);
      return this.mapLayoutItems(defaultLayout);
    }

    try {
      const dbLayout = await this.videoLayoutRepository.getLayout(layoutId);
      if (!dbLayout?.items) {
        this.logService.warn(
          `[Story ${storyId}] Layout ${layoutId} not found or empty. Using default.`
        );
        return this.mapLayoutItems(defaultLayout);
      }

      const parsedItems =
        typeof dbLayout.items === "string" ? JSON.parse(dbLayout.items) : dbLayout.items;
      const layout = this.mapLayoutItems(parsedItems);

      if (layout.length === 0) {
        this.logService.warn(
          `[Story ${storyId}] Layout ${layoutId} resulted in empty layout. Using default.`
        );
        return this.mapLayoutItems(defaultLayout);
      }

      return layout;
    } catch (error: any) {
      this.logService.error(
        `[Story ${storyId}] Failed to fetch layout: ${error.message}. Using default.`
      );
      return this.mapLayoutItems(defaultLayout);
    }
  }

  mapLayoutItems(rawItems: any[]): LayoutItem[] {
    if (!Array.isArray(rawItems)) {
      this.logService.warn(`[Layout] Expected array, got ${typeof rawItems}`);
      return [];
    }

    return rawItems
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        if (item.type === "image") {
          return this.validateImageLayout(item);
        } else if (item.type === "text") {
          return this.validateTextLayout(item);
        }

        this.logService.warn(`[Layout] Unknown item type: ${item.type}`);
        return null;
      })
      .filter((item): item is LayoutItem => item !== null);
  }

  prepareScaledLayout(
    originalLayout: LayoutItem[],
    outputWidth: number,
    outputHeight: number
  ): LayoutItem[] {
    return originalLayout.map((item) => this.scaleLayoutItem(item, outputWidth, outputHeight));
  }

  scaleLayoutItem(item: LayoutItem, targetWidth: number, targetHeight: number): LayoutItem {
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

  private validateImageLayout(item: any): ImageLayoutItem | null {
    if (!this.hasValidDimensions(item)) {
      this.logService.warn(`[Layout] Invalid image dimensions: ${JSON.stringify(item)}`);
      return null;
    }

    return {
      type: "image",
      width: item.width,
      height: item.height,
      position: item.position,
    };
  }

  private validateTextLayout(item: any): TextLayoutItem | null {
    if (!this.hasValidTextProperties(item)) {
      this.logService.warn(`[Layout] Invalid text properties: ${JSON.stringify(item)}`);
      return null;
    }

    return {
      type: "text",
      color: item.color,
      backgroundColor: item.backgroundColor || "#ffffff",
      fontSize: item.fontSize,
      position: item.position,
      width: item.width,
      height: item.height,
      fontFamily: typeof item.fontFamily === "string" ? item.fontFamily : undefined,
      box: typeof item.box === "boolean" ? item.box : undefined,
      boxColor: typeof item.boxColor === "string" ? item.boxColor : undefined,
      boxBorderW: typeof item.boxBorderW === "number" ? item.boxBorderW : undefined,
      lineSpacing: typeof item.lineSpacing === "number" ? item.lineSpacing : undefined,
    };
  }

  private hasValidDimensions(item: any): boolean {
    return (
      typeof item.width === "number" &&
      typeof item.height === "number" &&
      item.position &&
      typeof item.position.x === "number" &&
      typeof item.position.y === "number"
    );
  }

  private hasValidTextProperties(item: any): boolean {
    return (
      typeof item.color === "string" &&
      typeof item.fontSize === "number" &&
      this.hasValidDimensions(item)
    );
  }
}
