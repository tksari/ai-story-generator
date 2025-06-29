import { inject, injectable } from "tsyringe";
import { Story, Page } from "@prisma/client";
import { StoryRepository } from "@/domain/story/story.repository";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { HttpError } from "@/middleware/error-handler";
import { applySettingsPatch } from "@/domain/story/story.utils";
import { CreateStoryParams, UpdateStoryParams } from "@/domain/story/types/story.type";

@injectable()
export class StoryService {
  constructor(
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("QueueService") private queueService: QueueService,
    @inject("LogService") private logService: LogService
  ) {}

  async getStoryById(id: number): Promise<Story | null> {
    return this.storyRepository.getStoryById(id);
  }

  async getStoryWithPages(id: number): Promise<
    | (Story & {
        pages: Array<
          Page & {
            generatedImages: Array<{
              id: number;
              path: string;
            }>;
            generatedVideos: Array<{
              id: number;
              path: string;
            }>;
          }
        >;
      })
    | null
  > {
    return this.storyRepository.getStoryWithPages(id);
  }

  async create(params: CreateStoryParams): Promise<Story> {
    try {
      const story = await this.storyRepository.createStory(params);

      this.logService.info(`Created story: ${story.id} - ${story.title}`);

      return story;
    } catch (error) {
      this.logService.error(
        `Error creating story: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async update(id: number, data: UpdateStoryParams): Promise<Story> {
    try {
      const story = await this.storyRepository.getStoryById(id);

      if (!story) {
        throw new HttpError(400, "Invalid story ID");
      }

      const updateData: UpdateStoryParams = {
        ...data,
      };

      if (data.settings) {
        updateData.settings = applySettingsPatch(story.settings, data.settings);
      }

      if (data.generationConfig) {
        updateData.generationConfig = applySettingsPatch(
          story.generationConfig,
          data.generationConfig
        );
      }

      const updatedStory = await this.storyRepository.updateStory(id, updateData);

      this.logService.info(`Updated story: ${id}`);

      return updatedStory;
    } catch (error) {
      this.logService.error(
        `Error updating story: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async delete(id: number): Promise<Story> {
    try {
      const story = await this.storyRepository.deleteStory(id);

      this.logService.info(`Deleted story: ${id}`);

      return story;
    } catch (error) {
      this.logService.error(
        `Error deleting story: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async getStories(page = 1, pageSize = 10): Promise<{ stories: Story[]; total: number }> {
    return this.storyRepository.getStories(page, pageSize);
  }

  async searchStories(
    query: string,
    page = 1,
    pageSize = 10
  ): Promise<{ stories: Story[]; total: number }> {
    return this.storyRepository.searchStories(query, page, pageSize);
  }
}
