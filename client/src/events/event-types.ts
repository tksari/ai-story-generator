export const EVENT_TYPES = {
  PAGE_GENERATING: "page:generating",
  VIDEO_CREATED: "video:created",
  VIDEO_UPDATE: "video:update",
  VIDEO_DELETED: "video:deleted",
  IMAGE_CREATED: "image:created",
  IMAGE_UPDATE: "image:update",
  IMAGE_SET_DEFAULT: "image:set:default",
  IMAGE_BULK_ADD: "image:bulk:add",
  IMAGE_DELETED: "image:deleted",
  SPEECH_CREATED: "speech:created",
  SPEECH_BULK_ADD: "speech:bulk:add",
  SPEECH_UPDATE: "speech:update",
  SPEECH_DELETED: "speech:deleted",
  SPEECH_SET_DEFAULT: "speech:set:default",
  MEDIA_UPDATE: "media:update",
  STORY_SETTINGS_UPDATE: "story:settings:update",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
