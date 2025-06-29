<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="editingStory ? 'Edit Story' : 'Create Story'"
    size="500px"
    :destroy-on-close="true"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="story-form"
    >
      <el-tabs>
        <el-tab-pane label="Story Details">
          <el-form-item label="Title" prop="title">
            <el-input v-model="form.title" placeholder="Enter story title" />
          </el-form-item>

          <el-form-item label="Description" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="Enter story description"
            />
          </el-form-item>

          <el-form-item label="Language" prop="language">
            <el-select
              v-model="form.generationConfig.language"
              placeholder="Select language"
              class="w-full"
            >
              <el-option
                v-for="option in generationOptions.languageOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Language Level" prop="language_level">
            <el-select
              v-model="form.generationConfig.language_level"
              placeholder="Select language level"
              class="w-full"
            >
              <el-option
                v-for="option in generationOptions.levelOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Max Sentences" prop="max_sentences">
            <el-input-number
              v-model="form.generationConfig.max_sentences"
              :min="1"
              :max="50"
              :step="1"
            />
          </el-form-item>

          <el-form-item label="Story Type" prop="story_type">
            <el-select
              v-model="form.generationConfig.story_type"
              placeholder="Select story type"
              class="w-full"
            >
              <el-option
                v-for="option in generationOptions.storyTypeOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Age Group" prop="age_group">
            <el-select
              v-model="form.generationConfig.age_group"
              placeholder="Select age group"
              class="w-full"
            >
              <el-option
                v-for="option in generationOptions.ageGroupOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Genre" prop="genre">
            <el-select
              v-model="form.generationConfig.genre"
              placeholder="Select genre"
              class="w-full"
            >
              <el-option
                v-for="option in generationOptions.genreOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Theme" prop="theme">
            <el-input
              v-model="form.generationConfig.theme"
              type="textarea"
              :rows="2"
              placeholder="Enter story theme"
            />
          </el-form-item>

          <el-form-item label="Characters" prop="characters">
            <el-input
              v-model="form.generationConfig.characters"
              type="textarea"
              :rows="3"
              placeholder="Enter story characters (one per line)"
            />
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="Generation Settings">
          <el-collapse>
            <el-collapse-item title="Video Settings" name="1">
              <el-form-item label="Resolution">
                <el-select
                  v-model="form.settings.video.resolution"
                  class="w-full"
                >
                  <el-option
                    v-for="option in videoOptions.resolutionOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="FPS">
                <el-select v-model="form.settings.video.fps" class="w-full">
                  <el-option
                    v-for="option in videoOptions.fpsOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Codec">
                <el-select v-model="form.settings.video.codec" class="w-full">
                  <el-option
                    v-for="option in videoOptions.videoCodecOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Quality">
                <el-select v-model="form.settings.video.quality" class="w-full">
                  <el-option
                    v-for="option in videoOptions.qualityOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Pixel Format">
                <el-select
                  v-model="form.settings.video.pixel_format"
                  class="w-full"
                >
                  <el-option
                    v-for="option in videoOptions.pixelFormatOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Bitrate">
                <el-select v-model="form.settings.video.bitrate" class="w-full">
                  <el-option
                    v-for="option in videoOptions.bitrateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-collapse-item>

            <el-collapse-item title="Audio Settings" name="2">
              <el-form-item label="Codec">
                <el-select v-model="form.settings.audio.codec" class="w-full">
                  <el-option
                    v-for="option in audioOptions.audioCodecOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Sample Rate">
                <el-select
                  v-model="form.settings.audio.sample_rate"
                  class="w-full"
                >
                  <el-option
                    v-for="option in audioOptions.audioSampleRateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Bitrate">
                <el-select v-model="form.settings.audio.bitrate" class="w-full">
                  <el-option
                    v-for="option in audioOptions.audioBitrateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Channels">
                <el-select
                  v-model="form.settings.audio.channels"
                  class="w-full"
                >
                  <el-option
                    v-for="option in audioOptions.audioChannelOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Normalize">
                <el-switch v-model="form.settings.audio.normalization" />
              </el-form-item>
            </el-collapse-item>

            <el-collapse-item title="Transition Settings" name="3">
              <el-form-item label="Transition Type">
                <el-select
                  v-model="form.settings.transition.type"
                  class="w-full"
                >
                  <el-option
                    v-for="option in transitionOptions.transitionOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>
      </el-tabs>
      <div class="form-actions">
        <el-button @click="$emit('update:modelValue', false)">Cancel</el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">
          {{ editingStory ? "Update" : "Create" }}
        </el-button>
      </div>
    </el-form>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { useStoryStore } from "@/stores/story.store";
import { useSettingOptionsStore } from "@/stores/settingOptions";
import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_STORY_SETTINGS,
} from "@/utils/storyDefaults";
import type { Story } from "@/types/story.types";
import { CreateStoryDto } from "@/types/story.types";

const props = defineProps<{
  modelValue: boolean;
  editingStory: Story | null;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: any): void;
}>();

const router = useRouter();
const storyStore = useStoryStore();
const settingOptionsStore = useSettingOptionsStore();
const formRef = ref<FormInstance>();
const isSubmitting = ref(false);

const generationOptions = computed(
  () => settingOptionsStore.options?.generation_options,
);
const videoOptions = computed(
  () => settingOptionsStore.options?.settings?.video,
);
const audioOptions = computed(
  () => settingOptionsStore.options?.settings?.audio,
);
const transitionOptions = computed(
  () => settingOptionsStore.options?.settings?.transition,
);

const form = ref<CreateStoryDto>({
  ...DEFAULT_STORY_SETTINGS,
});

const rules: FormRules = {
  title: [
    { required: true, message: "Please input story title", trigger: "blur" },
    { min: 5, max: 100, message: "Length should be 5 to 100", trigger: "blur" },
  ],
  "generationConfig.language": [
    { required: true, message: "Please select language", trigger: "change" },
  ],
  "generationConfig.language_level": [
    {
      required: true,
      message: "Please select language level",
      trigger: "change",
    },
  ],
  "generationConfig.story_type": [
    { required: true, message: "Please select story type", trigger: "change" },
  ],
  "generationConfig.age_group": [
    { required: true, message: "Please select age group", trigger: "change" },
  ],
  "generationConfig.genre": [
    { required: true, message: "Please select genre", trigger: "change" },
  ],
};

watch(
  () => props.editingStory,
  (newStory) => {
    if (newStory) {
      form.value = {
        ...newStory,
        generationConfig: {
          ...DEFAULT_GENERATION_CONFIG,
          ...newStory.generationConfig,
        },
        settings: { ...DEFAULT_VIDEO_SETTINGS, ...newStory.settings },
      };
    } else {
      form.value = {
        ...DEFAULT_STORY_SETTINGS,
      };
    }
  },
  { immediate: true },
);

const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    isSubmitting.value = true;
    if (props.editingStory) {
      await storyStore.updateStory(props.editingStory.id, form.value);
      ElMessage.success("Story updated successfully");
      return;
    }

    const story = await storyStore.createStory(form.value);
    ElMessage.success("Story created successfully");
    router.push(`/stories/${story.id}`);
  } catch (error) {
    ElMessage.error("Failed to create story");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.story-form {
  padding: 20px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-drawer__body) {
  padding: 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.w-full {
  width: 100%;
}
</style>
