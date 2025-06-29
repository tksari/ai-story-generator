<template>
  <el-card class="gallery-card">
    <template #header>
      <div class="gallery-header">
        <h3>Images</h3>
        <slot name="actions">
          <el-button type="success" @click="handleGenerateImage" size="small">
            Generate Image
          </el-button>
        </slot>
      </div>
    </template>

    <div class="images-grid">
      <div v-if="page.generatedImages?.length === 0" class="empty-gallery">
        <el-empty :description="`No images available`" />
      </div>
      <div
        v-else
        v-for="image in page.generatedImages"
        :key="image.id"
        class="image-item"
        :class="{ 'default-container': image.isDefault }"
      >
        <el-image
          :src="getMediaUrl(image.path)"
          fit="cover"
          class="gallery-thumbnail"
          @click="handleView(image)"
        >
          <template #error>
            <div class="image-error">
              <el-icon>
                <Picture />
              </el-icon>
            </div>
          </template>
        </el-image>

        <div v-if="image.isDefault" class="default-badge">
          <el-icon>
            <StarFilled />
          </el-icon>
        </div>

        <div
          v-if="isProcessing(image.status)"
          class="generating-progress-image"
        >
          <el-progress
            :percentage="getProgressInfo(image).percentage"
            :status="getProgressInfo(image).status"
            :show-text="true"
            class="image-gallery-progress"
          />
          <span class="progress-text">{{
            getProgressInfo(image).message
          }}</span>
        </div>

        <div
          class="image-actions"
          v-if="isFailed(image.status) || isCompleted(image.status)"
        >
          <el-button
            type="success"
            circle
            @click="handleSetDefault(image)"
            :disabled="image.isDefault || !hasAccessAction(image.status)"
          >
            <el-icon>
              <StarFilled />
            </el-icon>
          </el-button>
          <el-button type="danger" circle @click="handleDelete(image)">
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
import { StarFilled, Delete, Picture } from "@element-plus/icons-vue";
import { useImageGallery } from "@/composables/useImageGallery";
import { computed } from "vue";
import type { Page } from "@/types/page.types";
import {
  isProcessing,
  getProgressInfo,
  isCompleted,
  isFailed,
  hasAccessAction,
} from "@/utils/status.helper";

const props = defineProps<{
  page: Page;
  title?: string;
  type?: "Image" | "Voice";
  showGenerateButton?: boolean;
}>();

const page = computed(() => props.page);

const {
  getMediaUrl,
  handleView,
  handleGenerateImage,
  handleSetDefault,
  handleDelete,
} = useImageGallery(page);
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

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 12px;
}

.image-item {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  aspect-ratio: 1 / 1;
}

.gallery-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
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
  z-index: 10;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.image-error {
  width: 100%;
  height: 100%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-error .el-icon {
  font-size: 30px;
  color: var(--el-text-color-secondary);
}

.default-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: var(--el-color-success);
  color: white;
  padding: 2px;
  border-radius: 4px;
  z-index: 1;
}

.empty-gallery {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

:deep(.image-preview-dialog) {
  max-width: 90vw !important;
  max-height: 90vh !important;
}

:deep(.image-preview-dialog .el-message-box__content) {
  padding: 0;
  margin: 0;
}

:deep(.image-preview-dialog .el-message-box__message) {
  padding: 0;
  margin: 0;
}

:deep(.image-preview-dialog .el-message-box__container) {
  padding: 0;
  margin: 0;
}

:deep(.image-preview-modal) {
  background-color: rgba(0, 0, 0, 0.8);
}

:deep(.image-preview-dialog .el-dialog__header) {
  padding: 10px;
  margin: 0;
  background: var(--el-bg-color);
}

:deep(.image-preview-dialog .el-dialog__body) {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--el-bg-color);
}

:deep(.image-preview-dialog .el-dialog__headerbtn) {
  top: 10px;
  right: 10px;
}

.default-container {
  border: 1px solid #67c23a;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>
