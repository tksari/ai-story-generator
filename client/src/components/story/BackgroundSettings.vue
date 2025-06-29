<template>
  <div class="background-settings">
    <el-form label-position="top" class="background-settings-form">
      <!-- Background Settings -->
      <el-form-item label="Background Type">
        <el-radio-group v-model="background.type" class="w-full">
          <el-radio value="color">Color</el-radio>
          <el-radio value="image">Image</el-radio>
          <el-radio value="gradient">Gradient</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- Color Background -->
      <template v-if="background.type === 'color'">
        <el-form-item label="Background Color">
          <el-color-picker
            v-model="background.color"
            show-alpha
            :predefine="predefinedColors"
          />
        </el-form-item>
      </template>

      <!-- Image Background -->
      <template v-if="background.type === 'image'">
        <el-form-item label="Background Image">
          <el-upload
            class="background-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleBackgroundUpload"
            :before-upload="beforeBackgroundUpload"
          >
            <img
              v-if="background.image"
              :src="background.image"
              class="background-preview"
            />
            <el-icon v-else class="background-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="Image Fit">
          <el-select v-model="background.fit" class="w-full">
            <el-option label="Cover" value="cover" />
            <el-option label="Contain" value="contain" />
            <el-option label="Fill" value="fill" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Gradient Background -->
      <template v-if="background.type === 'gradient'">
        <el-form-item label="Gradient Type">
          <el-select v-model="background.gradientType" class="w-full">
            <el-option label="Linear" value="linear" />
            <el-option label="Radial" value="radial" />
          </el-select>
        </el-form-item>

        <el-form-item label="Start Color">
          <el-color-picker v-model="background.gradientStart" show-alpha />
        </el-form-item>

        <el-form-item label="End Color">
          <el-color-picker v-model="background.gradientEnd" show-alpha />
        </el-form-item>

        <el-form-item v-if="background.gradientType === 'linear'" label="Angle">
          <el-slider v-model="background.gradientAngle" :min="0" :max="360" />
        </el-form-item>
      </template>

      <el-form-item label="Opacity">
        <el-slider v-model="background.opacity" :min="0" :max="100" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { BackgroundSettings } from "@/types/story.types";
import isEqual from "lodash/isEqual";

const props = defineProps<{
  modelValue: BackgroundSettings;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: BackgroundSettings];
}>();

const background = ref<BackgroundSettings>({
  ...props.modelValue,
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEqual(newValue, props.modelValue)) {
      background.value = {
        ...newValue,
      };
    }
  },
  { immediate: true },
);

watch(
  background,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true },
);

const predefinedColors = [
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "rgba(255, 69, 0, 0.68)",
  "rgb(255, 120, 0)",
  "hsv(51, 100, 98)",
  "hsva(120, 40, 94, 0.5)",
  "hsl(181, 100%, 37%)",
  "hsla(209, 100%, 56%, 0.73)",
  "#c7158577",
];

const handleBackgroundUpload = (response: any) => {
  background.value.image = response.url;
};

const beforeBackgroundUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("Upload file can only be image format!");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("Upload file size can not exceed 2MB!");
    return false;
  }
  return true;
};
</script>

<style scoped>
.background-settings-form {
  max-width: 600px;
  margin: 0 auto;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.background-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.background-uploader:hover {
  border-color: var(--el-color-primary);
}

.background-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.background-preview {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}
</style>
