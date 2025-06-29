<template>
  <div class="layout-selector-component">
    <el-form-item>
      <el-select
        v-model="selectedLayout"
        class="layout-selector"
        :loading="isLoading"
      >
        <el-option label="Default" :value="defaultLayout" />
        <el-option
          v-for="layout in layouts"
          :key="layout.id"
          :label="layout.name"
          :value="layout.id"
        >
          <span>{{ layout.name }}</span>
        </el-option>
      </el-select>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { LayoutSettings } from "@/types/story.types";
import isEqual from "lodash/isEqual";
import { Layout } from "@/types/editor";

const props = defineProps<{
  modelValue: LayoutSettings | null;
  layouts: Layout[];
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits(["update:modelValue"]);

const defaultLayout = "default";
const selectedLayout = ref<string | null>(
  props.modelValue?.id || defaultLayout,
);

watch(selectedLayout, (newValue) => {
  const value = newValue === defaultLayout ? null : { id: newValue };
  if (!isEqual(newValue, props.modelValue?.id)) {
    emit("update:modelValue", value);
  }
});
</script>

<style scoped>
.layout-selector-component {
  width: 100%;
}

.layout-selector {
  width: 100%;
}

.error-message {
  color: var(--el-color-danger);
  margin-top: 8px;
  font-size: 0.9em;
}
</style>
