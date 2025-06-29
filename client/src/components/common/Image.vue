<template>
  <div class="image-container" :style="{ width: width, height: height }">
    <el-image
      :src="src"
      :fit="fit"
      :preview-src-list="preview ? [src] : []"
      :style="{ width: '100%', height: '100%' }"
    >
      <template #error>
        <div class="image-placeholder">
          <el-icon><Picture /></el-icon>
        </div>
      </template>
    </el-image>
  </div>
</template>

<script setup lang="ts">
import { Picture } from "@element-plus/icons-vue";

defineProps<{
  src: string;
  width?: string;
  height?: string;
  fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  preview?: boolean;
}>();
</script>

<style scoped>
.image-container {
  overflow: hidden;
  border-radius: 4px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.image-placeholder .el-icon {
  font-size: 32px;
}
</style>
