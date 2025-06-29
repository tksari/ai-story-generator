import { injectable } from "tsyringe";

@injectable()
export class PromptService {
  constructor() {}

  public buildPromptSettingLines(config: any): string[] {
    const parts: string[] = [];

    if (config.genre) parts.push(`Genre: ${config.genre}`);
    if (config.theme) parts.push(`Theme: ${config.theme}`);
    if (config.age_group) parts.push(`Age group: ${config.age_group}`);
    if (config.characters) parts.push(`Main characters: ${config.characters}`);
    if (config.story_type) parts.push(`Story type: ${config.story_type}`);
    if (config.language_level) parts.push(`CEFR level: ${config.language_level}`);

    return parts;
  }

  public buildTextGenerationSettingsPrompt(story: any): string {
    const config = story.generationConfig || {};
    const parts = this.buildPromptSettingLines(config);

    if (config.language) parts.unshift(`Language: ${config.language}`);
    if (config.language_level === "A1") {
      parts.push(`Use only basic vocabulary and short, simple sentences.`);
    } else if (config.language_level === "A2") {
      parts.push(`Use simple sentence structures and avoid complex grammar.`);
    }

    if (config.max_sentences) {
      parts.push(
        `Each page must have exactly ${config.max_sentences} sentence${config.max_sentences > 1 ? "s" : ""}.`
      );
    }

    return parts.join("\n");
  }

  public buildImagePrompt(content: string, generationConfig: any): string {
    const parts = this.buildPromptSettingLines(generationConfig);

    if (generationConfig.style) {
      parts.push(`Visual style: ${generationConfig.style}`);
    }

    if (content) {
      parts.push(`Scene: ${content}`);
    }

    return `Create an illustration with the following details:\n\n${parts.join("\n")}\n\nOnly return the image prompt.`;
  }

  public buildSystemPromptForStoryPages({
    story,
    startPageNumber,
    pageCount,
    isEndStory,
  }: {
    story: any;
    startPageNumber: number;
    pageCount: number;
    isEndStory: boolean;
  }): string {
    const endPageNumber = startPageNumber + pageCount - 1;
    const settingsPrompt = this.buildTextGenerationSettingsPrompt(story);

    const lines: string[] = [
      `You are a professional story writer.`,
      `Write ${pageCount} consecutive story pages (from page ${startPageNumber} to page ${endPageNumber}) for the story titled "${story.title}".`,
      settingsPrompt,
    ];

    if (isEndStory) {
      lines.push(
        `This is the final part of the story. Conclude the story naturally and satisfyingly.`
      );
    }

    lines.push(
      `Separate each page using markers: PAGE_X_START and PAGE_X_END.`,
      `Do not include any page numbers, headings, or labels inside the page content. Only return the raw story text.`
    );

    return lines.join("\n");
  }

  public buildUserPromptForStoryPages({
    startPageNumber,
    pageCount,
    storyContext,
    storyPart,
  }: {
    startPageNumber: number;
    pageCount: number;
    storyContext: string[];
    storyPart: string;
  }): string {
    const endPageNumber = startPageNumber + pageCount - 1;

    const lines: string[] = [
      `Write ${pageCount} consecutive pages (from page ${startPageNumber} to page ${endPageNumber}), continuing from:`,
      `"${storyPart}"`,
    ];

    if (storyContext.length) {
      lines.push(`\nPrevious pages:\n${storyContext.join("\n\n")}`);
      lines.push(`\nContinue logically and consistently.`);
    } else {
      lines.push(`\nThis is the beginning of the story. Start engagingly.`);
    }

    lines.push(`\nPlease format your response as follows:\n`);

    for (let i = 0; i < pageCount; i++) {
      const pageNum = startPageNumber + i;
      lines.push(
        `PAGE_${pageNum}_START`,
        `[Content for page ${pageNum}]`,
        `PAGE_${pageNum}_END`,
        ``
      );
    }

    lines.push(`Ensure each page flows naturally from the previous one.`);

    return lines.join("\n");
  }
}
