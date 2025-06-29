<template>
  <div class="dashboard">
    <el-row v-loading="dashboardStore.isLoading" :gutter="20">
      <template v-if="dashboardStore.getError">
        <el-col :span="24">
          <el-alert
            :title="dashboardStore.getError"
            type="error"
            show-icon
            @close="dashboardStore.error = null"
          />
        </el-col>
      </template>
      <el-col :span="8">
        <StatCard
          title="Generated Images"
          :total="imageStats.total || 0"
          :stats="imageStats"
        />
      </el-col>
      <el-col :span="8">
        <StatCard
          title="Generated Speeches"
          :total="speechStats.total || 0"
          :stats="speechStats"
        />
      </el-col>
      <el-col :span="8">
        <StatCard
          title="Generated Videos"
          :total="videoStats.total || 0"
          :stats="videoStats"
        />
      </el-col>
    </el-row>
    <el-row :gutter="20" class="mt-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Recent Stories</span>
              <el-button type="primary" link @click="$router.push('/stories')">
                View All
              </el-button>
            </div>
          </template>
          <el-table :data="recentStories" style="width: 100%">
            <el-table-column prop="title" label="Title" />
            <el-table-column prop="createdAt" label="Created At" width="180">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="80" fixed="right">
              <template #default="{ row }">
                <el-tooltip content="View Story" placement="top">
                  <el-button
                    type="primary"
                    :icon="View"
                    circle
                    @click="$router.push(`/stories/${row.id}`)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Recent Videos</span>
            </div>
          </template>
          <el-table :data="recentVideos" style="width: 100%">
            <el-table-column prop="title" label="Title" />
            <el-table-column prop="duration" label="Duration" width="100">
              <template #default="{ row }">
                {{ formatDuration(row.duration) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="120" fixed="right">
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
                  <el-tooltip content="View Story" placement="top">
                    <el-button
                      type="primary"
                      :icon="View"
                      circle
                      @click="$router.push(`/stories/${row.storyId}`)"
                    />
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <VideoPreview v-model="showPreview" :video="selectedVideo" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { View } from "@element-plus/icons-vue";
import { useDashboardStore } from "@/stores/dashboard.store";
import { VideoPlay } from "@element-plus/icons-vue";
import { useVideoGallery } from "@/composables/useVideoGallery";
import VideoPreview from "@/components/video/VideoPreview.vue";
import StatCard from "@/components/dashboard/StatCard.vue";

const dashboardStore = useDashboardStore();

const { handleWatch, showPreview, selectedVideo } = useVideoGallery();

const imageStats = computed(
  () => dashboardStore.getStats?.images.byStatus || {},
);
const speechStats = computed(
  () => dashboardStore.getStats?.speeches.byStatus || {},
);
const videoStats = computed(
  () => dashboardStore.getStats?.videos.byStatus || {},
);

const recentStories = computed(
  () => dashboardStore.getStats?.stories.lastStories || [],
);
const recentVideos = computed(
  () => dashboardStore.getStats?.videos.lastVideos || [],
);

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

onMounted(() => {
  dashboardStore.fetchStats();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
