import { injectable, inject } from "tsyringe";
import { VideoLayoutRepository } from "@/domain/layout/video-layout.repository";

@injectable()
export class VideoLayoutService {
  constructor(
    @inject("VideoLayoutRepository")
    private layoutRepository: VideoLayoutRepository
  ) {}

  async saveLayout(data: any) {
    try {
      return await this.layoutRepository.saveLayout(data);
    } catch (error) {
      throw new Error("Failed to save layout");
    }
  }

  async getLayout(id: string) {
    try {
      const layout = await this.layoutRepository.getLayout(id);
      if (!layout) {
        throw new Error("Layout not found");
      }
      return layout;
    } catch (error) {
      throw new Error("Failed to get layout");
    }
  }

  async updateLayout(id: string, data: any) {
    try {
      return await this.layoutRepository.updateLayout(id, data);
    } catch (error) {
      throw new Error("Failed to update layout");
    }
  }

  async deleteLayout(id: string) {
    try {
      return await this.layoutRepository.deleteLayout(id);
    } catch (error) {
      throw new Error("Failed to delete layout");
    }
  }

  async listLayouts() {
    try {
      return await this.layoutRepository.listLayouts();
    } catch (error) {
      throw new Error("Failed to list layouts");
    }
  }

  async getDefaultLayout() {
    try {
      const layouts = await this.layoutRepository.listLayouts();
      return layouts[0] || null;
    } catch (error) {
      throw new Error("Failed to get default layout");
    }
  }
}
