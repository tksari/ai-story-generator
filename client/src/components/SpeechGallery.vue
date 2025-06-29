<template>
  <el-card class="gallery-card">
    <template #header>
      <div class="gallery-header">
        <h3>Speeches</h3>
        <el-button type="success" @click="handleGenerateSpeech" size="small">
          Generate Speech
        </el-button>
      </div>
    </template>

    <div class="speeches-grid">
      <div
        v-if="!generatedSpeeches || generatedSpeeches.length === 0"
        class="empty-gallery"
      >
        <el-empty description="No speeches available" />
      </div>
      <div
        v-else
        v-for="speech in generatedSpeeches"
        :key="speech.id"
        class="speech-item"
        :class="{ 'default-container': speech.isDefault }"
      >
        <div class="speech-header">
          <span class="speech-date">{{ formatDate(speech.createdAt) }}</span>
          <el-icon v-if="speech.isDefault" class="default-icon">
            <StarFilled />
          </el-icon>
        </div>
        <div v-if="isProcessing(speech.status)" class="generating-progress">
          <el-progress
            :show-text="true"
            :percentage="getProgressInfo(speech).percentage"
            :status="getProgressInfo(speech).status"
          />
          <span class="progress-text">{{
            getProgressInfo(speech).message
          }}</span>
        </div>
        <audio
          v-if="hasAccessAction(speech.status)"
          :src="getMediaUrl(speech.path)"
          controls
          class="speech-audio"
          @play="handleSpeechPlay($event)"
        ></audio>
        <div
          class="speech-actions"
          v-if="isFailed(speech.status) || isCompleted(speech.status)"
        >
          <el-button
            type="success"
            circle
            @click="handleSetDefaultSpeech(speech)"
            :disabled="speech.isDefault || !hasAccessAction(speech.status)"
          >
            <el-icon>
              <StarFilled />
            </el-icon>
          </el-button>
          <el-button type="danger" circle @click="handleDeleteSpeech(speech)">
            <el-icon>
              <Delete />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { StarFilled, Delete } from "@element-plus/icons-vue";
import { useSpeechGallery } from "@/composables/useSpeechGallery.ts";
import {
  isProcessing,
  getProgressInfo,
  isCompleted,
  isFailed,
  hasAccessAction,
} from "@/utils/status.helper";
import { GeneratedSpeech } from "@/types/generated-speech.types.ts";

const props = defineProps<{
  page: {
    id: number;
    generatedSpeeches?: GeneratedSpeech[];
  };
}>();

const page = computed(() => props.page);

const {
  getMediaUrl,
  handleSetDefaultSpeech,
  handleDeleteSpeech,
  handleGenerateSpeech,
} = useSpeechGallery(page);

const currentlyPlayingSpeech = ref<HTMLAudioElement | null>(null);

const generatedSpeeches = computed(() => props.page.generatedSpeeches);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const handleSpeechPlay = (event: Event) => {
  if (
    currentlyPlayingSpeech.value &&
    currentlyPlayingSpeech.value !== event.target
  ) {
    currentlyPlayingSpeech.value.pause();
  }
  currentlyPlayingSpeech.value = event.target as HTMLAudioElement;
};
</script>

<style scoped>
.gallery-card {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.el-card__body) {
  height: calc(100% - 55px);
  overflow-y: auto;
  padding: 0;
}

.speeches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 12px;
}

.speech-item {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  background-color: #f5f7fa;
}

.speech-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.speech-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.speech-audio {
  width: 100%;
  margin-bottom: 10px;
}

.speech-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.default-icon {
  color: var(--el-color-success);
}

.empty-gallery {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.speech-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.default-container {
  border: 1px solid #67c23a;
}

.speech-item:hover .speech-actions {
  opacity: 1;
}
</style>
