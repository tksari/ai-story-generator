<template>
  <el-card class="videos-container">
    <div class="header">
      <h2 class="title">Generated Videos</h2>
      <el-button
        type="primary"
        @click="handleGenerateVideo(storyId)"
        :loading="isGeneratingVideo"
      >
        Generate Video
      </el-button>
    </div>

    <el-table v-loading="loading" :data="localVideos" style="width: 100%">
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="status" label="Status" width="150">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Progress" min-width="250">
        <template #default="{ row }">
          <div>
            <el-progress
              :key="row.id"
              :show-text="true"
              :percentage="getProgressInfo(row).percentage"
              :status="getProgressInfo(row).status"
            />
            <!--<span class="progress-text">{{ getProgressInfo(row).message }}</span>-->
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="Duration" width="100">
        <template #default="{ row }">
          {{ formatDuration(row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="Created" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="150" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip content="Watch Video" placement="top">
              <el-button
                type="primary"
                :icon="VideoPlay"
                circle
                @click="handleWatch(row)"
              />
            </el-tooltip>
            <el-tooltip content="Delete Video" placement="top">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="handleDelete(row)"
              />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <VideoPreview v-model="showPreview" :video="selectedVideo" />
    <el-dialog v-model="showDeleteDialog" title="Delete Video" width="400px">
      <p>
        Are you sure you want to delete this video? This action cannot be
        undone.
      </p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="isDeleting">
            Delete
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { VideoPlay, Delete } from "@element-plus/icons-vue";
import { useVideoGallery } from "@/composables/useVideoGallery";
import { getStatusType, getProgressInfo } from "@/utils/status.helper";
import type { GeneratedVideo } from "@/types/generated-video.types";
import VideoPreview from "@/components/video/VideoPreview.vue";

const props = defineProps<{
  storyId: number;
  videos: GeneratedVideo[];
  loading: boolean;
}>();

defineEmits<{
  (e: "refresh"): void;
}>();

const {
  showPreview,
  showDeleteDialog,
  selectedVideo,
  isDeleting,
  isGeneratingVideo,
  handleWatch,
  handleDelete,
  confirmDelete,
  handleGenerateVideo,
  formatDate,
  formatDuration,
} = useVideoGallery();

const localVideos = ref<Array<GeneratedVideo>>([]);

watch(
  () => props.videos,
  (newVideos) => {
    localVideos.value = newVideos;
  },
  { immediate: true },
);
</script>

<style scoped>
.videos-container {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  display: block;
}
</style>
