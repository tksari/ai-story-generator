<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps<{
  currentPage: number;
  total: number;
  pageSize: number;
}>();

const emit = defineEmits<{
  (e: "update:currentPage", page: number): void;
  (e: "update:pageSize", size: number): void;
}>();

const router = useRouter();
const route = useRoute();

const currentPage = ref(props.currentPage);
const pageSize = ref(props.pageSize);

// Initialize from URL on mount
onMounted(() => {
  const pageFromUrl = parseInt(route.query.page as string) || props.currentPage;
  const pageSizeFromUrl =
    parseInt(route.query.pageSize as string) || props.pageSize;

  if (pageFromUrl !== props.currentPage) {
    currentPage.value = pageFromUrl;
    emit("update:currentPage", pageFromUrl);
  }

  if (pageSizeFromUrl !== props.pageSize) {
    pageSize.value = pageSizeFromUrl;
    emit("update:pageSize", pageSizeFromUrl);
  }
});

// Watch for prop changes
watch(
  () => props.currentPage,
  (newValue) => {
    currentPage.value = newValue;
  },
);

watch(
  () => props.pageSize,
  (newValue) => {
    pageSize.value = newValue;
  },
);

// Watch for URL changes
watch(
  () => route.query,
  () => {
    const pageFromUrl = parseInt(route.query.page as string) || 1;
    const pageSizeFromUrl = parseInt(route.query.pageSize as string) || 10;

    if (pageFromUrl !== currentPage.value) {
      currentPage.value = pageFromUrl;
      emit("update:currentPage", pageFromUrl);
    }

    if (pageSizeFromUrl !== pageSize.value) {
      pageSize.value = pageSizeFromUrl;
      emit("update:pageSize", pageSizeFromUrl);
    }
  },
  { immediate: false },
);

const updateUrl = (page: number, size: number) => {
  const query = { ...route.query };

  if (page > 1) {
    query.page = page.toString();
  } else {
    delete query.page;
  }

  if (size !== 10) {
    // 10 is default
    query.pageSize = size.toString();
  } else {
    delete query.pageSize;
  }

  router.push({ query });
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  updateUrl(page, pageSize.value);
  emit("update:currentPage", page);
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  updateUrl(1, size); // Reset to page 1 when changing page size
  emit("update:pageSize", size);
};
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
