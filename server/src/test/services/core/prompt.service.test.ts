import { PromptService } from "@/core/prompt/prompt.service";
import { splitContentIntoPages } from "@/utils/index";

const TEST_CONFIGS = {
  fullConfig: {
    genre: "fantasy",
    theme: "adventure",
    age_group: "children",
    characters: "wizard, dragon",
    story_type: "fairy tale",
    language_level: "A1",
  },
  partialConfig: {
    genre: "fantasy",
    theme: "adventure",
  },
  emptyConfig: {},
};

const TEST_STORY = {
  title: "The Magic Forest",
  generationConfig: {
    language: "English",
    ...TEST_CONFIGS.fullConfig,
    max_sentences: 3,
  },
};

describe("PromptService", () => {
  let service: PromptService;

  beforeEach(() => {
    service = new PromptService();
  });

  describe("splitContentIntoPages", () => {
    it("should correctly split content into pages", () => {
      const content = `PAGE_3_START
Page 3 content
PAGE_3_END

PAGE_4_START
Page 4 content
PAGE_4_END

PAGE_5_START
Page 5 content
PAGE_5_END

PAGE_6_START
Page 6 content
PAGE_6_END`;

      const result = splitContentIntoPages(content, 3, 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toBe("Page 3 content");
      expect(result[1]).toBe("Page 4 content");
      expect(result[2]).toBe("Page 5 content");
      expect(result[3]).toBe("Page 6 content");
    });

    it("should handle missing page markers", () => {
      const content = `PAGE_3_START
Some content
PAGE_3_END

PAGE_4_START
Missing end marker

PAGE_5_START
Some content
PAGE_5_END`;

      const result = splitContentIntoPages(content, 3, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Some content");
      expect(result[1]).toBe("Error generating content for page 4.");
      expect(result[2]).toBe("Some content");
    });

    it("should handle empty content", () => {
      const result = splitContentIntoPages("", 1, 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Error generating content for page 1.");
      expect(result[1]).toBe("Error generating content for page 2.");
    });

    it("should handle content with extra whitespace", () => {
      const content = `PAGE_1_START
    Content with extra spaces    
PAGE_1_END`;

      const result = splitContentIntoPages(content, 1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe("Content with extra spaces");
    });

    it("should handle duplicate page numbers", () => {
      const content = `PAGE_1_START
First
PAGE_1_END

PAGE_1_START
Second
PAGE_1_END`;
      const result = splitContentIntoPages(content, 1, 2);
      expect(result[0]).toBe("First");
      expect(result[1]).toBe("Error generating content for page 2.");
    });

    it("should handle null content (as string)", () => {
      const result = splitContentIntoPages("null", 1, 1);
      expect(result[0]).toBe("Error generating content for page 1.");
    });

    it("should handle undefined content (as string)", () => {
      const result = splitContentIntoPages("undefined", 1, 1);
      expect(result[0]).toBe("Error generating content for page 1.");
    });

    it("should handle number as content (as string)", () => {
      const result = splitContentIntoPages(String(123), 1, 1);
      expect(result[0]).toBe("Error generating content for page 1.");
    });
  });

  describe("buildImagePrompt", () => {
    it("should build image prompt with all config options", () => {
      const content = "A magical forest scene";
      const generationConfig = {
        style: "fantasy",
        ...TEST_CONFIGS.fullConfig,
      };

      const result = service.buildImagePrompt(content, generationConfig);

      expect(result).toContain("Genre: fantasy");
      expect(result).toContain("Theme: adventure");
      expect(result).toContain("Age group: children");
      expect(result).toContain("Story type: fairy tale");
      expect(result).toContain("Main characters: wizard, dragon");
      expect(result).toContain("CEFR level: A1");
      expect(result).toContain("Scene: A magical forest scene");
    });

    it("should build image prompt with minimal config", () => {
      const content = "A simple scene";
      const result = service.buildImagePrompt(content, TEST_CONFIGS.emptyConfig);

      expect(result).toContain("Scene: A simple scene");
      expect(result).not.toContain("Genre:");
      expect(result).not.toContain("Theme:");
    });

    it("should handle empty content", () => {
      const result = service.buildImagePrompt("", TEST_CONFIGS.fullConfig);
      expect(result).not.toContain("Scene:");
      expect(result).toContain("Create an illustration with the following details:");
    });

    it("should handle undefined content (as string)", () => {
      const result = service.buildImagePrompt("undefined", TEST_CONFIGS.fullConfig);
      expect(result).toContain("Scene: undefined");
    });

    it("should handle null content (as string)", () => {
      const result = service.buildImagePrompt("null", TEST_CONFIGS.fullConfig);
      expect(result).toContain("Scene: null");
    });

    it("should handle undefined generationConfig (as empty object)", () => {
      const result = service.buildImagePrompt("A scene", {});
      expect(result).toContain("Scene: A scene");
    });

    it("should handle null generationConfig (as empty object)", () => {
      const result = service.buildImagePrompt("A scene", {});
      expect(result).toContain("Scene: A scene");
    });

    it("should handle non-object generationConfig (as empty object)", () => {
      const result = service.buildImagePrompt("A scene", {});
      expect(result).toContain("Scene: A scene");
    });
  });

  describe("buildPromptSettingLines", () => {
    it("should build prompt lines with all config options", () => {
      const result = service.buildPromptSettingLines(TEST_CONFIGS.fullConfig);

      expect(result).toHaveLength(6);
      expect(result).toContain("Genre: fantasy");
      expect(result).toContain("Theme: adventure");
      expect(result).toContain("Age group: children");
      expect(result).toContain("Main characters: wizard, dragon");
      expect(result).toContain("Story type: fairy tale");
      expect(result).toContain("CEFR level: A1");
    });

    it("should handle partial config", () => {
      const result = service.buildPromptSettingLines(TEST_CONFIGS.partialConfig);

      expect(result).toHaveLength(2);
      expect(result).toContain("Genre: fantasy");
      expect(result).toContain("Theme: adventure");
    });

    it("should handle empty config", () => {
      const result = service.buildPromptSettingLines(TEST_CONFIGS.emptyConfig);
      expect(result).toHaveLength(0);
    });
  });

  describe("buildTextGenerationSettingsPrompt", () => {
    it("should build settings prompt with all options", () => {
      const result = service.buildTextGenerationSettingsPrompt(TEST_STORY);

      expect(result).toContain("Language: English");
      expect(result).toContain("Genre: fantasy");
      expect(result).toContain("Theme: adventure");
      expect(result).toContain("Age group: children");
      expect(result).toContain("Main characters: wizard, dragon");
      expect(result).toContain("Story type: fairy tale");
      expect(result).toContain("CEFR level: A1");
      expect(result).toContain("Use only basic vocabulary and short, simple sentences.");
      expect(result).toContain("Each page must have exactly 3 sentences.");
    });

    it("should handle A2 language level", () => {
      const story = {
        generationConfig: {
          language_level: "A2",
        },
      };

      const result = service.buildTextGenerationSettingsPrompt(story);

      expect(result).toContain("Use simple sentence structures and avoid complex grammar.");
    });

    it("should handle single sentence requirement", () => {
      const story = {
        generationConfig: {
          max_sentences: 1,
        },
      };

      const result = service.buildTextGenerationSettingsPrompt(story);

      expect(result).toContain("Each page must have exactly 1 sentence.");
    });

    it("should handle missing max_sentences", () => {
      const story = { generationConfig: { ...TEST_CONFIGS.fullConfig } };
      const result = service.buildTextGenerationSettingsPrompt(story);
      expect(result).not.toContain("Each page must have exactly");
    });

    it("should handle non-number max_sentences", () => {
      const story = {
        generationConfig: { ...TEST_CONFIGS.fullConfig, max_sentences: "abc" },
      };
      const result = service.buildTextGenerationSettingsPrompt(story);
      expect(result).toContain("Each page must have exactly abc sentence.");
    });
  });

  describe("buildSystemPromptForStoryPages", () => {
    it("should build system prompt with all options", () => {
      const result = service.buildSystemPromptForStoryPages({
        story: TEST_STORY,
        startPageNumber: 1,
        pageCount: 3,
        isEndStory: false,
      });

      expect(result).toContain("You are a professional story writer.");
      expect(result).toContain(
        'Write 3 consecutive story pages (from page 1 to page 3) for the story titled "The Magic Forest"'
      );
      expect(result).toContain("Language: English");
      expect(result).toContain("Genre: fantasy");
      expect(result).toContain("Separate each page using markers: PAGE_X_START and PAGE_X_END");
      expect(result).toContain(
        "Do not include any page numbers, headings, or labels inside the page content"
      );
    });
  });

  describe("buildUserPromptForStoryPages", () => {
    const TEST_STORY_CONTEXT = ["Page 1 content", "Page 2 content", "Page 3 content"];
    const TEST_STORY_PART = "The wizard entered the forest...";

    it("should build user prompt with story context", () => {
      const result = service.buildUserPromptForStoryPages({
        startPageNumber: 4,
        pageCount: 2,
        storyContext: TEST_STORY_CONTEXT,
        storyPart: TEST_STORY_PART,
      });

      expect(result).toContain(
        "Write 2 consecutive pages (from page 4 to page 5), continuing from:"
      );
      expect(result).toContain(`"${TEST_STORY_PART}"`);
      expect(result).toContain("Previous pages:");
      expect(result).toContain(TEST_STORY_CONTEXT[0]);
      expect(result).toContain("Continue logically and consistently");
      expect(result).toContain("PAGE_4_START");
      expect(result).toContain("PAGE_4_END");
      expect(result).toContain("PAGE_5_START");
      expect(result).toContain("PAGE_5_END");
    });

    it("should build user prompt for story beginning", () => {
      const result = service.buildUserPromptForStoryPages({
        startPageNumber: 1,
        pageCount: 2,
        storyContext: [],
        storyPart: "Once upon a time...",
      });

      expect(result).toContain(
        "Write 2 consecutive pages (from page 1 to page 2), continuing from:"
      );
      expect(result).toContain('"Once upon a time..."');
      expect(result).toContain("This is the beginning of the story. Start engagingly");
      expect(result).toContain("PAGE_1_START");
      expect(result).toContain("PAGE_1_END");
      expect(result).toContain("PAGE_2_START");
      expect(result).toContain("PAGE_2_END");
    });
  });
});
