<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Video Preview"
    width="800px"
    destroy-on-close
  >
    <video
      v-if="video?.path"
      :src="getMediaUrl(video.path)"
      controls
      class="video-preview"
    />
    <div v-else class="no-video">No video available</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { getMediaUrl } from "@/utils/media.helper.ts";
import type { GeneratedVideo } from "@/types/generated-video.types";

defineProps<{
  modelValue: boolean;
  video: GeneratedVideo | null;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<style scoped>
.video-preview {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.no-video {
  text-align: center;
  padding: 2rem;
  color: #909399;
}
</style>
