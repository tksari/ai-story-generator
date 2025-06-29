<template>
  <div class="story-appearance-settings">
    <el-form label-position="top">
      <div class="section-header">
        <span class="section-title">Layout</span>
        <div class="section-line"></div>
      </div>
      <LayoutSelector
        v-model="localState.layout"
        :layouts="editorStore.layouts"
        :is-loading="editorStore.isLoading"
        :error="editorStore.error"
      />
      <div class="section-header">
        <span class="section-title">Background Settings</span>
        <div class="section-line"></div>
      </div>
      <BackgroundSettingsComponent v-model="localState.background" />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import LayoutSelector from "@/components/story/LayoutSelector.vue";
import type { BackgroundSettings, LayoutSettings } from "@/types/story.types";
import BackgroundSettingsComponent from "./BackgroundSettings.vue";
import isEqual from "lodash/isEqual";
import { useLayoutEditorStore } from "@/stores/layout-editor";

const props = defineProps<{
  modelValue: {
    layout: LayoutSettings | null;
    background: BackgroundSettings;
  };
  storyId: number;
}>();

const editorStore = useLayoutEditorStore();

const emit = defineEmits<{
  (e: "update:modelValue", value: typeof props.modelValue): void;
}>();

const localState = ref({
  ...props.modelValue,
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEqual(newValue, props.modelValue)) {
      localState.value = {
        ...newValue,
      };
    }
  },
  { deep: true },
);

watch(
  localState,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true },
);

onMounted(async () => {
  await editorStore.loadFromService(false);
});
</script>

<style scoped>
.story-appearance-settings {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  margin: 20px 0 12px;
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 12px;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    var(--el-border-color) 0%,
    rgba(220, 223, 230, 0.1) 100%
  );
}

.error-message {
  color: var(--el-color-danger);
  margin-top: 8px;
  font-size: 0.9em;
}
</style>
