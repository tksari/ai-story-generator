<template>
  <div class="video-settings">
    <el-form label-position="top" class="video-settings-form">
      <el-form-item label="Resolution" prop="resolution">
        <el-select v-model="settings.resolution" class="w-full">
          <el-option
            v-for="option in resolutionOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="FPS" prop="fps">
        <el-select v-model="settings.fps" class="w-full">
          <el-option
            v-for="option in fpsOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Codec" prop="codec">
        <el-select v-model="settings.codec" class="w-full">
          <el-option
            v-for="option in videoCodecOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Quality" prop="quality">
        <el-select v-model="settings.quality" class="w-full">
          <el-option
            v-for="option in qualityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Pixel Format" prop="pixel_format">
        <el-select v-model="settings.pixel_format" class="w-full">
          <el-option
            v-for="option in pixelFormatOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Bitrate" prop="bitrate">
        <el-select v-model="settings.bitrate" class="w-full">
          <el-option
            v-for="option in videoBitrateOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSettingOptionsStore } from "@/stores/settingOptions";
import type { StorySettings } from "@/types/story.types";
import isEqual from "lodash/isEqual";

const settingOptionsStore = useSettingOptionsStore();
const options = settingOptionsStore.options as any;

const props = defineProps<{
  modelValue: Partial<StorySettings["video"]>;
}>();

const settings = ref<StorySettings["video"]>({
  ...(props.modelValue as StorySettings["video"]),
});

const emit = defineEmits(["update:modelValue"]);

watch(
  settings,
  (val: StorySettings["video"]) => {
    if (!isEqual(val, props.modelValue)) {
      emit("update:modelValue", val);
    }
  },
  { deep: true },
);

const video = options?.settings?.video || {};

const {
  resolutionOptions = [],
  fpsOptions = [],
  videoCodecOptions = [],
  qualityOptions = [],
  pixelFormatOptions = [],
  videoBitrateOptions = [],
} = video;
</script>

<style scoped>
.video-settings-form {
  max-width: 600px;
  margin: 0 auto;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.w-full {
  width: 100%;
}
</style>
