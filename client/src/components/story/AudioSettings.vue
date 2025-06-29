<template>
  <div class="audio-settings">
    <el-form label-position="top" class="audio-settings-form">
      <el-form-item label="Codec" prop="codec">
        <el-select v-model="settings.codec" class="w-full">
          <el-option
            v-for="option in codecOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Bitrate" prop="bitrate">
        <el-select v-model="settings.bitrate" class="w-full">
          <el-option
            v-for="option in bitrateOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Sample Rate" prop="sample_rate">
        <el-select v-model="settings.sample_rate" class="w-full">
          <el-option
            v-for="option in sampleRateOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Channels" prop="channels">
        <el-select v-model="settings.channels" class="w-full">
          <el-option
            v-for="option in channelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Normalize" prop="normalization">
        <el-switch v-model="settings.normalization" />
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
  modelValue: Partial<StorySettings["audio"]>;
}>();

const settings = ref<StorySettings["audio"]>({
  ...(props.modelValue as StorySettings["audio"]),
});

const emit = defineEmits(["update:modelValue"]);

watch(
  settings,
  (val: StorySettings["audio"]) => {
    if (!isEqual(val, props.modelValue)) {
      emit("update:modelValue", val);
    }
  },
  { deep: true },
);

const codecOptions = options?.settings?.audio?.audioCodecOptions || [];
const bitrateOptions = options?.settings?.audio?.audioBitrateOptions || [];
const sampleRateOptions =
  options?.settings?.audio?.audioSampleRateOptions || [];
const channelOptions = options?.settings?.audio?.audioChannelOptions || [];
</script>

<style scoped>
.audio-settings-form {
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
