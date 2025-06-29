<template>
  <el-card class="stat-card no-padding">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
      </div>
    </template>
    <div class="stat-value">{{ total }}</div>
    <div class="stat-subtitle">
      <el-tag type="success">{{ stats.DONE || 0 }} Done</el-tag>
      <el-tag type="warning">{{ stats.PENDING || 0 }} Pending</el-tag>
      <el-tag type="info">{{ stats.IN_PROGRESS || 0 }} In Progress</el-tag>
      <el-tag type="danger">{{ stats.FAILED || 0 }} Failed</el-tag>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  total: number;
  stats: {
    DONE: number;
    PENDING: number;
    IN_PROGRESS: number;
    FAILED: number;
  };
}>();
</script>

<style scoped>
.stat-card {
  height: 100%;
}

.no-padding :deep(.el-card__body) {
  padding-left: 0;
  padding-right: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: var(--el-color-primary);
}

.stat-subtitle {
  text-align: center;
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
}
</style>
