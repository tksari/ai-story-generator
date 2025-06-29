<template>
  <div class="story-settings" v-if="form">
    <el-form
      ref="formRef"
      :model="form"
      label-position="top"
      class="story-settings-form"
    >
      <el-form-item label="Language" prop="language">
        <el-select
          v-model="form.language"
          placeholder="Select language"
          class="w-full"
        >
          <el-option
            v-for="option in settingOptionsStore.options?.generation_options
              ?.languageOptions"
            :key="option.code"
            :label="option.name"
            :value="option.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Language Level" prop="language_level">
        <el-select
          v-model="form.language_level"
          placeholder="Select language level"
          class="w-full"
        >
          <el-option
            v-for="option in settingOptionsStore.options?.generation_options
              ?.levelOptions"
            :key="option.code"
            :label="option.name"
            :value="option.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Max Sentences" prop="max_sentences">
        <el-input-number
          v-model="form.max_sentences"
          :min="1"
          :max="50"
          :step="1"
        />
      </el-form-item>

      <el-form-item label="Story Type" prop="story_type">
        <el-select
          v-model="form.story_type"
          placeholder="Select story type"
          class="w-full"
        >
          <el-option
            v-for="option in settingOptionsStore.options?.generation_options
              ?.storyTypeOptions"
            :key="option.code"
            :label="option.name"
            :value="option.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Age Group" prop="age_group">
        <el-select
          v-model="form.age_group"
          placeholder="Select age group"
          class="w-full"
        >
          <el-option
            v-for="option in settingOptionsStore.options?.generation_options
              ?.ageGroupOptions"
            :key="option.code"
            :label="option.name"
            :value="option.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Genre" prop="genre">
        <el-select
          v-model="form.genre"
          placeholder="Select genre"
          class="w-full"
        >
          <el-option
            v-for="option in settingOptionsStore.options?.generation_options
              ?.genreOptions"
            :key="option.code"
            :label="option.name"
            :value="option.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Theme" prop="theme">
        <el-input
          v-model="form.theme"
          type="textarea"
          :rows="2"
          placeholder="Enter story theme"
        />
      </el-form-item>

      <el-form-item label="Characters" prop="characters">
        <el-input
          v-model="form.characters"
          type="textarea"
          :rows="2"
          placeholder="Enter characters (comma separated)"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { GenerationConfig } from "@/types/story.types";
import { useSettingOptionsStore } from "@/stores/settingOptions";

const settingOptionsStore = useSettingOptionsStore();

const props = defineProps<{
  modelValue: GenerationConfig;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: GenerationConfig): void;
}>();

const form = ref<GenerationConfig>({
  ...props.modelValue,
});

watch(
  () => props.modelValue,
  (val) => {
    form.value = val;
  },
  { deep: true },
);

watch(
  form,
  (val) => {
    emit("update:modelValue", val);
  },
  { deep: true },
);
</script>

<style scoped>
.story-settings-form {
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
