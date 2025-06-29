<template>
  <el-container class="pages-container">
    <div class="main-content">
      <el-aside width="300px" class="pages-sidebar">
        <div class="sidebar-header">
          <h2 class="title">Pages</h2>
          <div class="header-actions">
            <el-button
              type="primary"
              @click="showAddPageModal = true"
              size="small"
              :disabled="pageGenerating?.isGenerating"
            >
              <el-icon>
                <Plus />
              </el-icon>
              Add Page
            </el-button>
          </div>
        </div>
        <el-scrollbar>
          <div
            class="page-list"
            :class="{ 'is-generating': pageGenerating?.isGenerating }"
          >
            <draggable
              v-model="sortedPages"
              item-key="id"
              @end="handleDragEnd"
              handle=".page-list-item"
              ghost-class="ghost"
            >
              <template #item="{ element: page }">
                <div
                  class="page-list-item"
                  :class="{ 'is-active': selectedPage?.id === page.id }"
                  @click="selectPage(page)"
                >
                  <div class="page-info">
                    <h3 class="page-title">Page {{ page.pageNumber }}</h3>
                    <p class="page-preview">
                      {{ truncateContent(page.content, 25) }}
                    </p>
                  </div>
                  <div class="page-actions">
                    <el-button
                      type="primary"
                      link
                      @click.stop="handleEdit(page)"
                    >
                      <el-icon>
                        <Edit />
                      </el-icon>
                    </el-button>
                    <el-button
                      type="danger"
                      link
                      @click.stop="handleDelete(page)"
                    >
                      <el-icon>
                        <Delete />
                      </el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-scrollbar>
      </el-aside>
      <div class="content-area" v-if="pageGenerating?.isGenerating">
        <el-main class="gallery-container">
          <div class="loading-container">
            <el-progress
              type="circle"
              :percentage="
                pageGenerating?.progress === 0 ? 30 : pageGenerating?.progress
              "
              :width="150"
              :stroke-width="8"
              :class="{ 'is-loading': pageGenerating?.progress === 0 }"
            >
              <template #default="{ percentage }">
                <div class="progress-content">
                  <span
                    v-if="pageGenerating?.progress === 0"
                    class="progress-text"
                    >Pages are being generated...</span
                  >
                  <template v-else>
                    <span class="progress-percentage">{{ percentage }}%</span>
                    <span class="progress-text">Generating Page</span>
                  </template>
                </div>
              </template>
            </el-progress>
            <p class="loading-message">
              Please wait while we generate your page content...
            </p>
          </div>
        </el-main>
      </div>
      <div class="content-area" v-else-if="selectedPage">
        <el-main class="gallery-container">
          <el-row :gutter="20">
            <el-col :span="12">
              <ImageGallery :page="selectedPage" />
            </el-col>
            <el-col :span="12">
              <SpeechGallery :page="selectedPage" />
            </el-col>
          </el-row>
        </el-main>
      </div>
      <el-empty
        class="empty-container"
        v-else
        description="Select a page to view details"
      />
    </div>
  </el-container>
  <el-dialog
    v-model="showAddPageModal"
    title="Add New Page"
    width="50%"
    :close-on-click-modal="false"
  >
    <el-form :model="newPage" label-position="top">
      <el-form-item label="Page Number">
        <el-input-number v-model="newPage.pageNumber" :min="1" class="w-full" />
      </el-form-item>
      <el-form-item label="Content">
        <el-input
          v-model="newPage.content"
          type="textarea"
          :rows="4"
          placeholder="Enter page content..."
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddPageModal = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleAddPage"
          :loading="pagesStore.loading"
        >
          Add Page
        </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showEditPageModal"
    title="Edit Page"
    width="50%"
    :close-on-click-modal="false"
  >
    <el-form :model="editingPage" label-position="top">
      <el-form-item label="Page Number">
        <el-input-number
          v-model="editingPage.pageNumber"
          :min="1"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="Content">
        <el-input
          v-model="editingPage.content"
          type="textarea"
          :rows="4"
          placeholder="Enter page content..."
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showEditPageModal = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleUpdatePage"
          :loading="pagesStore.loading"
        >
          Save Changes
        </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="showDeleteModal" title="Delete Page" width="30%">
    <p>Are you sure you want to delete this page?</p>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDeleteModal = false">Cancel</el-button>
        <el-button
          type="danger"
          @click="handleConfirmDelete"
          :loading="pagesStore.loading"
        >
          Delete
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { usePagesStore } from "@/stores/pages.store";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import SpeechGallery from "@/components/SpeechGallery.vue";
import ImageGallery from "@/components/ImageGallery.vue";
import { usePage } from "@/composables/usePage";
import draggable from "vuedraggable";

const props = defineProps<{
  storyId: number;
}>();

const pagesStore = usePagesStore();

const {
  showAddPageModal,
  showEditPageModal,
  showDeleteModal,
  selectedPage,
  newPage,
  editingPage,
  sortedPages,
  pageGenerating,
  truncateContent,
  selectPage,
  handleAddPage,
  handleEdit,
  handleUpdatePage,
  handleDelete,
  handleConfirmDelete,
  handleDragEnd,
  initEvents,
  cleanupEvents,
  checkActivePageGenerationJob,
} = usePage(props.storyId);

onMounted(async () => {
  try {
    initEvents();
    await checkActivePageGenerationJob();
    await pagesStore.fetchPages(props.storyId);
    if (pagesStore.pages.length > 0) {
      selectedPage.value = pagesStore.pages[0];
    }
  } catch (err) {
    console.error("Error in Pages component:", err);
  }
});

onUnmounted(() => {
  cleanupEvents();
  selectedPage.value = null;
});
</script>

<style scoped>
.pages-container {
  height: calc(100vh - 120px);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pages-sidebar {
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
}

.sidebar-footer {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--el-border-color-light);
  margin-top: auto;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-list {
  padding: 16px;
}

.page-list-item {
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: move;
  user-select: none;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color);
}

.page-list-item:hover {
  background-color: var(--el-fill-color-light);
}

.page-list-item.is-active {
  background-color: var(--el-color-primary-light-9);
}

.page-info {
  flex: 1;
  margin-right: 12px;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.page-preview {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-actions {
  display: flex;
}

.gallery-container {
  padding: 20px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-container {
  width: 100%;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 24px;
}

:deep(.el-progress-circle__track) {
  stroke: #dedede !important;
}

:deep(.el-progress-circle__path) {
  stroke: var(--el-color-primary) !important;
}

:deep(.is-loading .el-progress-circle__path) {
  animation: rotate 2s linear infinite;
  transform-origin: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.progress-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.loading-message {
  color: var(--el-text-color-secondary);
  font-size: 16px;
  text-align: center;
  margin: 0;
}

.page-list.is-generating {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.page-list {
  opacity: 1;
  transition: opacity 0.3s ease;
}
</style>
