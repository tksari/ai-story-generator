<template>
  <div class="stories">
    <div class="page-header">
      <h2>Stories</h2>
      <el-button type="primary" @click="showCreateForm = true">
        Create Story
      </el-button>
    </div>
    <el-card class="stories-table">
      <el-table v-loading="loading" :data="stories" style="width: 100%">
        <el-table-column prop="title" label="Title" min-width="200">
          <template #default="{ row }">
            <div class="story-title">
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="description"
          label="Description"
          min-width="300"
          show-overflow-tooltip
        />
        <el-table-column prop="createdAt" label="Created" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column
          prop="videos"
          label="Videos"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row?._count?.generatedVideos || 0 }}
          </template>
        </el-table-column>

        <el-table-column prop="pages" label="Pages" width="100" align="center">
          <template #default="{ row }">
            {{ row?._count?.pages || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="View Story" placement="top">
                <el-button
                  type="primary"
                  :icon="View"
                  circle
                  @click="viewStory(row)"
                />
              </el-tooltip>
              <el-tooltip content="Edit Story" placement="top">
                <el-button
                  type="warning"
                  :icon="Edit"
                  circle
                  @click="editStory(row)"
                />
              </el-tooltip>
              <el-tooltip content="Delete Story" placement="top">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="confirmDelete(row)"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <Pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="pagination.total"
          @update:current-page="handlePageChange"
          @update:page-size="handleSizeChange"
        />
      </div>
    </el-card>
    <CreateStoryForm
      v-model="showCreateForm"
      :editing-story="editingStory"
      @submit="handleSubmit"
      @update:model-value="handleFormVisibilityChange"
    />
    <el-dialog v-model="showDeleteDialog" title="Delete Story" width="400px">
      <p>
        Are you sure you want to delete this story? This action cannot be
        undone.
      </p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">Cancel</el-button>
          <el-button type="danger" @click="deleteStory" :loading="isDeleting">
            Delete
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { View, Edit, Delete } from "@element-plus/icons-vue";
import { useStory } from "@/composables/useStory";
import CreateStoryForm from "@/components/story/CreateStoryForm.vue";
import Pagination from "@/components/common/Pagination.vue";
import type { CreateStoryDto, Story } from "@/types/story.types";

const router = useRouter();
const {
  stories,
  pagination,
  loading,
  fetchStories,
  createStory,
  updateStory,
  deleteStory: deleteStoryAction,
} = useStory();

const currentPage = ref(1);
const pageSize = ref(10);

const showCreateForm = ref(false);
const editingStory = ref<Story | null>(null);
const isDeleting = ref(false);

const showDeleteDialog = ref(false);
const storyToDelete = ref<Story | null>(null);

function viewStory(story: Story) {
  router.push(`/stories/${story.id}`);
}

function editStory(story: Story) {
  editingStory.value = story;
  showCreateForm.value = true;
}

function confirmDelete(story: Story) {
  storyToDelete.value = story;
  showDeleteDialog.value = true;
}

async function loadStories() {
  await fetchStories(currentPage.value, pageSize.value);
}

async function deleteStory() {
  if (!storyToDelete.value) return;

  isDeleting.value = true;
  try {
    await deleteStoryAction(storyToDelete.value.id);
    ElMessage.success("Story deleted successfully");
    showDeleteDialog.value = false;
    await loadStories();
  } catch (error) {
    ElMessage.error("Failed to delete story");
  } finally {
    isDeleting.value = false;
  }
}

function handleFormVisibilityChange(visible: boolean) {
  showCreateForm.value = visible;
  if (!visible) {
    editingStory.value = null;
  }
}

async function handleSubmit(formData: CreateStoryDto) {
  try {
    if (editingStory.value) {
      await updateStory(editingStory.value.id, formData);
      ElMessage.success("Story updated successfully");
    } else {
      await createStory(formData);
      ElMessage.success("Story created successfully");
    }
    showCreateForm.value = false;
    editingStory.value = null;
    await loadStories();
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";
    ElMessage.error(errorMessage);
  }
}

async function handlePageChange(page: number) {
  currentPage.value = page;
  await loadStories();
}

async function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  await loadStories();
}

onMounted(async () => {
  await loadStories();
});
</script>

<style scoped>
.stories {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.stories-table {
  margin-bottom: 20px;
}

.story-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.action-buttons {
  display: flex;
}

.action-buttons .el-button {
  padding: 6px;
}

.action-buttons .el-button :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
