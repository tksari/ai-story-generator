import { inject, injectable } from "tsyringe";
import { PageRepository } from "@/domain/story/page/page.repository";
import { JobService } from "@/domain/job/job.service";
import { JobRepository } from "@/domain/job/job.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { Job, JobType, Page } from "@prisma/client";
import { splitContentIntoPages } from "@/utils/index";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { ProviderInstanceResolver } from "@/providers/ProviderInstanceResolver";
import { PromptService } from "@/core/prompt/prompt.service";
import { QueueService } from "@/infrastructure/queue/queue.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { CapabilityType, JobStatus } from "@prisma/client";
import {
  CreatePageInput,
  createPageSchema,
  UpdatePageInput,
  UpdatePageOrderInput,
  updatePageOrderSchema,
  updatePageSchema,
} from "./page.schema";

@injectable()
export class PageService {
  constructor(
    @inject("PageRepository") private pageRepository: PageRepository,
    @inject("StoryRepository") private storyRepository: StoryRepository,
    @inject("JobRepository") private jobRepository: JobRepository,
    @inject("JobService") private jobService: JobService,
    @inject("QueueService") private queueService: QueueService,
    @inject("LogService") private logService: LogService,
    @inject("EventEmitterService") private eventEmitter: EventEmitterService,
    @inject("PromptService") private promptService: PromptService,
    @inject("ProviderInstanceResolver")
    private providerInstanceResolver: ProviderInstanceResolver
  ) {}

  async createPage(storyId: number, data: CreatePageInput): Promise<Page> {
    const parsedData = createPageSchema.parse(data);

    await this.jobService.assertNoActiveJob(storyId, [JobType.PAGE, JobType.VIDEO]);
    return await this.pageRepository.create(storyId, parsedData);
  }

  async updatePage(id: number, data: UpdatePageInput): Promise<Page> {
    const parsedData = updatePageSchema.parse(data);

    const page = await this.pageRepository.findById(id);
    if (!page) throw new Error("Page not found");

    await this.jobService.assertNoActiveJob(page.storyId, [JobType.PAGE, JobType.VIDEO]);

    return await this.pageRepository.update(id, parsedData);
  }

  async deletePage(id: number): Promise<void> {
    const page = await this.pageRepository.findById(id);
    if (!page) throw new Error("Page not found");

    await this.jobService.assertNoActiveJob(page.storyId, [JobType.PAGE, JobType.VIDEO]);
    await this.pageRepository.delete(id);
  }

  async updatePageOrder(pageId: number, data: UpdatePageOrderInput): Promise<void> {
    const { newIndex } = updatePageOrderSchema.parse(data);

    const pageToMove = await this.pageRepository.findById(pageId);

    if (!pageToMove) {
      throw new Error("Page not found");
    }

    await this.jobService.assertNoActiveJob(pageToMove.storyId, [JobType.PAGE, JobType.VIDEO]);

    const pages = await this.pageRepository.findByStoryId(pageToMove.storyId);

    const otherPages = pages.filter((p) => p.id !== pageId);
    otherPages.splice(newIndex, 0, pageToMove);

    const updates = otherPages.map((page, index) => ({
      id: page.id,
      data: { pageNumber: index + 1 },
    }));

    await this.pageRepository.updateMany(updates);
  }

  private async fetchStoryAndContext(storyId: number) {
    const story = await this.storyRepository.getStoryById(storyId);
    if (!story) throw new Error(`Story not found with ID: ${storyId}`);

    const contextPages = await this.pageRepository.findLastPagesWithContent(storyId, 3);
    const storyContext = contextPages.map((p) => `PAGE_${p.pageNumber}: ${p.content}`);

    const lastPageNumber = contextPages.at(-1)?.pageNumber ?? 0;
    const nextPageNumber = lastPageNumber + 1;

    return { story, nextPageNumber, storyContext };
  }

  private async generatePageBatch({
    story,
    nextPageNumber,
    pageCount,
    storyContext,
    isEndStory,
    provider,
    storyId,
    totalPageCount,
    generatedCountRef,
  }: {
    story: any;
    nextPageNumber: number;
    pageCount: number;
    storyContext: string[];
    isEndStory: boolean;
    provider: any;
    storyId: number;
    totalPageCount: number;
    generatedCountRef: { count: number };
  }) {
    const systemPrompt = this.promptService.buildSystemPromptForStoryPages({
      story,
      startPageNumber: nextPageNumber,
      pageCount,
      isEndStory,
    });

    const userPrompt = this.promptService.buildUserPromptForStoryPages({
      startPageNumber: nextPageNumber,
      pageCount,
      storyContext,
      storyPart: story.title,
    });

    const result = await provider.generateText({
      systemPrompt,
      prompt: userPrompt,
    });

    const generatedContents = splitContentIntoPages(result.text, nextPageNumber, pageCount);

    for (let i = 0; i < generatedContents.length; i++) {
      const pageContent = generatedContents[i];

      const page = await this.pageRepository.create(story.id, {
        pageNumber: nextPageNumber + i,
        content: pageContent,
      });

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.PAGE}:${JobStatus.IN_PROGRESS}`,
        {
          storyId,
          page,
          progress: 0,
        }
      );

      storyContext.push(`PAGE ${nextPageNumber + i}: ${pageContent}`);
      storyContext = storyContext.slice(-5);

      generatedCountRef.count++;
      const progress = Math.floor((generatedCountRef.count / totalPageCount) * 100);

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.PAGE}:${JobStatus.IN_PROGRESS}`,
        {
          storyId,
          page,
          progress,
        }
      );
    }

    return {
      nextPageNumber: nextPageNumber + generatedContents.length,
      storyContext,
    };
  }

  async generateStoryPagesJob(
    taskId: string,
    storyId: number,
    pageCount: number,
    isEndStory: boolean
  ): Promise<void> {
    try {
      const {
        story,
        nextPageNumber: startPageNumber,
        storyContext,
      } = await this.fetchStoryAndContext(storyId);

      const totalPageCount = isEndStory && pageCount === 1 ? pageCount + 1 : pageCount;
      const batchSize = 5;
      const batches = Math.ceil(totalPageCount / batchSize);
      const generatedCountRef = { count: 0 };

      const resolvedProvider = await this.providerInstanceResolver.resolveInstance(
        CapabilityType.TEXT_GENERATION
      );
      if (!resolvedProvider?.instance) throw new Error("No text generation provider available");

      let nextPageNumber = startPageNumber;
      let context = storyContext;

      for (let batch = 0; batch < batches; batch++) {
        const remaining = totalPageCount - batch * batchSize;
        const currentBatchSize = Math.min(batchSize, remaining);

        const result = await this.generatePageBatch({
          story,
          nextPageNumber,
          pageCount: currentBatchSize,
          storyContext: context,
          isEndStory,
          provider: resolvedProvider.instance,
          storyId,
          totalPageCount,
          generatedCountRef,
        });

        nextPageNumber = result.nextPageNumber;
        context = result.storyContext;
      }

      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.PAGE}:${JobStatus.DONE}`,
        {
          storyId,
        }
      );

      await this.jobService.completeJob(taskId, {
        pageNumber: nextPageNumber,
        content: `PAGE ${nextPageNumber}: ${context}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logService.error(`Error in story generation: ${message}`);
      await this.jobService.failJob(taskId, message);
      await this.eventEmitter.emit(
        `${JobType.STORY}:${storyId}`,
        `${JobType.PAGE}:${JobStatus.FAILED}`,
        {
          storyId,
          error: message,
        }
      );
    }
  }

  async generatePagesForStory(
    id: number,
    pageCount: number,
    isEndStory: boolean
  ): Promise<boolean> {
    let job: Job | null = null;

    try {
      const story = await this.storyRepository.getStoryById(id);

      if (!story) {
        throw new Error(`Story not found with ID: ${id}`);
      }

      await this.jobService.assertNoActiveJob(story.id, [JobType.PAGE, JobType.VIDEO]);

      job = await this.jobService.createJob({
        storyId: story.id,
        type: JobType.PAGE,
      });

      await this.queueService.sendStoryGenerateMessage({
        taskId: job.taskId,
        storyId: id,
        pageCount,
        isEndStory,
      });

      this.logService.info(`Queued regeneration for story: ${id}`);
      return true;
    } catch (error) {
      const errorMesage = error instanceof Error ? error.message : String(error);
      if (job) {
        await this.jobService.failJob(job.taskId, errorMesage);
      }

      this.logService.error(`Error regenerating story: ${errorMesage}`);
      throw error;
    }
  }
}
