<template>
  <div class="story-detail">
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>
    <template v-else-if="localStory">
      <div class="story-header">
        <div class="story-title">
          <h1>{{ localStory.title }}</h1>
          <p class="story-description">{{ localStory.description }}</p>
        </div>
        <div class="story-actions">
          <el-button-group>
            <el-tooltip
              content="Auto Generate Pages (Creates new pages with AI)"
              placement="top"
            >
              <el-button
                type="success"
                @click="showAutoGenModal = true"
                size="small"
              >
                <el-icon>
                  <MagicStick />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="Generate Images for All Pages" placement="top">
              <el-button
                type="success"
                @click="handleGenerateAllImages"
                size="small"
              >
                <el-icon>
                  <Picture />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="Generate Speech for All Pages" placement="top">
              <el-button
                type="success"
                @click="handleGenerateAllSpeeches"
                size="small"
              >
                <el-icon>
                  <Microphone />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              content="Configure Story Settings (Layout, Background, etc.)"
              placement="top"
            >
              <el-button
                type="info"
                @click="showStorySettingsDrawer = true"
                size="small"
              >
                <el-icon>
                  <Setting />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="Save Story Changes" placement="top">
              <el-button
                type="success"
                @click="handleSave"
                :loading="isSaving"
                size="small"
              >
                <el-icon>
                  <Check />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="Delete Story" placement="top">
              <el-button
                type="danger"
                @click="handleDelete"
                :loading="isDeleting"
                size="small"
              >
                <el-icon>
                  <Delete />
                </el-icon>
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="story-tabs">
        <el-tab-pane label="Pages" name="pages">
          <Pages v-if="localStory" :story-id="localStory.id" />
        </el-tab-pane>

        <el-tab-pane label="Videos" name="videos">
          <Videos
            v-if="localStory"
            :story-id="localStory.id"
            :videos="localStory.generatedVideos"
            :loading="loading"
          />
        </el-tab-pane>
        <el-tab-pane label="Render" name="s-render">
          <div class="settings-grid">
            <div class="settings-section">
              <h3>Video Settings</h3>
              <VideoSettings v-model="localStory.settings.video" />
            </div>

            <div class="settings-section">
              <h3>Audio Settings</h3>
              <AudioSettings v-model="localStory.settings.audio" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <el-dialog
        v-model="showAutoGenModal"
        title="Auto Generate Pages"
        width="400px"
        :close-on-click-modal="false"
      >
        <el-form label-position="top">
          <el-form-item label="How many pages to generate?">
            <el-input-number v-model="autoGenPageCount" :min="1" :max="50" />
          </el-form-item>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="isEndStory" />
              End story after generation
            </label>
          </div>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showAutoGenModal = false">Cancel</el-button>
            <el-button type="primary" @click="handleGeneratePagesForStory">
              Generate
            </el-button>
          </span>
        </template>
      </el-dialog>
      <el-drawer
        v-model="showStorySettingsDrawer"
        title="Story Settings"
        size="500px"
      >
        <el-tabs v-model="activeSettingsTab">
          <el-tab-pane label="Generation" name="generation">
            <StorySettings
              :model-value="localStory.generationConfig"
              @update:modelValue="
                (value: GenerationConfig) => {
                  if (localStory) {
                    localStory = {
                      ...localStory,
                      generationConfig: value,
                    };
                  }
                }
              "
            />
          </el-tab-pane>
          <el-tab-pane label="Appearance" name="appearance">
            <StoryAppearanceSettings
              :story-id="localStory.id"
              :model-value="{
                layout: localStory.settings.layout,
                background: localStory.settings.background,
              }"
              @update:modelValue="
                (value: Partial<StorySettingsType>) => {
                  updateStorySettings(value);
                }
              "
            />
          </el-tab-pane>
          <el-tab-pane label="Providers" name="providers">
            <ProviderSelector
              :story-id="localStory.id"
              :model-value="localStory.settings.providers"
              @update:modelValue="
                (value: ProviderSettings) => {
                  updateStorySettings({ providers: value });
                }
              "
            />
          </el-tab-pane>
        </el-tabs>
      </el-drawer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { showConfirm } from "@/utils/message-box.helper.ts";
import {
  Setting,
  Check,
  Delete,
  MagicStick,
  Picture,
  Microphone,
} from "@element-plus/icons-vue";
import { useStory } from "@/composables/useStory";
import { usePage } from "@/composables/usePage";
import { socketService } from "@/services/socket.service";
import type {
  GenerationConfig,
  ProviderSettings,
  Story,
  StorySettings as StorySettingsType,
} from "@/types/story.types";

import StorySettings from "@/components/story/StorySettings.vue";
import VideoSettings from "@/components/story/VideoSettings.vue";
import AudioSettings from "@/components/story/AudioSettings.vue";
import StoryAppearanceSettings from "@/components/story/StoryAppearanceSettings.vue";
import ProviderSelector from "@/components/stories/ProviderSelector.vue";
import Pages from "@/components/pages/Pages.vue";
import Videos from "@/components/story/Videos.vue";

const route = useRoute();
const router = useRouter();
const { story, init, fetchStory, updateStory, deleteStory, cleanupEvents } =
  useStory();

const loading = ref(true);
const activeTab = ref("pages");
const activeSettingsTab = ref("generation");
const showStorySettingsDrawer = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);

const localStory = ref<Story | null>(null);

watch(
  () => story.value,
  (newStory) => {
    if (newStory) {
      localStory.value = { ...newStory };
    }
  },
  { deep: true, immediate: true },
);

const {
  showAutoGenModal,
  autoGenPageCount,
  handleGenerateAllImages,
  handleGenerateAllSpeeches,
  handleGeneratePagesForStory,
  isEndStory,
} = usePage(Number(route.params.id));

onMounted(async () => {
  try {
    const storyId = route.params.id;
    if (storyId) {
      await fetchStory(Number(storyId));

      if (story.value) {
        init();
        socketService.subscribeToRoom(story.value.id);
      }
    }
  } catch (error) {
    console.error("Error fetching story:", error);
    ElMessage.error("Failed to load story");
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (socketService.socket && story.value) {
    socketService.socket.emit("leave:story", story.value.id);
  }
  cleanupEvents();
});

const updateStorySettings = (updates: Partial<StorySettingsType>) => {
  if (!localStory.value) return;

  localStory.value.settings = {
    ...localStory.value.settings,
    ...updates,
  };
};

const handleSave = async () => {
  if (!localStory.value) return;
  try {
    isSaving.value = true;
    const payload = { ...(localStory.value as any) };
    delete payload.pages;

    await updateStory(localStory.value.id, payload);
    ElMessage.success("Story updated successfully");
  } catch (error) {
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (!story.value) return;

  try {
    await showConfirm(
      "Are you sure you want to delete this story? This action cannot be undone.",
      {
        title: "Delete Story",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    isDeleting.value = true;
    await deleteStory(story.value.id);
    ElMessage.success("Story deleted successfully");
    router.push("/stories");
  } catch (error) {
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.story-detail {
  background: white;
  min-height: 100vh;
  padding: 25px;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--el-padding);
}

.story-title {
  flex: 1;
}

.story-title h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--el-text-color-primary);
}

.story-description {
  margin: 0.5rem 0 0;
  color: var(--el-text-color-secondary);
}

.story-actions {
  display: flex;
  gap: 0.5rem;
}

.story-actions :deep(.el-button-group) {
  display: flex;
  gap: 0;
}

.story-actions :deep(.el-button) {
  border-radius: 0;
}

.story-actions :deep(.el-button:first-child) {
  border-top-left-radius: var(--el-border-radius-base);
  border-bottom-left-radius: var(--el-border-radius-base);
}

.story-actions :deep(.el-button:last-child) {
  border-top-right-radius: var(--el-border-radius-base);
  border-bottom-right-radius: var(--el-border-radius-base);
}

.story-tabs {
  margin-top: 2rem;
}

.story-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

.settings-section {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 1.5rem;
}

.settings-section h3 {
  margin: 0 0 1.5rem;
  color: var(--el-text-color-primary);
  font-size: 1.2rem;
}

.loading-state {
  padding: 2rem;
}

.no-settings {
  padding: 2rem;
  text-align: center;
}
</style>
