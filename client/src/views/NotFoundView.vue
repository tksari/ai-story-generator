<template>
  <div class="not-found">
    <el-result
      icon="error"
      title="404"
      sub-title="Sorry, the page you visited does not exist."
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">
          Back to Home
        </el-button>
      </template>
    </el-result>
  </div>
</template>
<script setup lang="ts"></script>

<style scoped>
.not-found {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
