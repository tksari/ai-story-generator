<template>
  <div class="request-logs-view">
    <el-card>
      <template #header>
        <div class="header-content">
          <h2>Request Logs</h2>
          <el-button type="primary" @click="refreshLogs" :loading="loading">
            <el-icon><Refresh /></el-icon>
            Refresh
          </el-button>
        </div>
      </template>

      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="Type" width="100" />
        <el-table-column prop="endpoint" label="Endpoint" min-width="200" />
        <el-table-column prop="method" label="Method" width="100">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.method)">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusCode" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.statusCode)">
              {{ row.statusCode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="Duration" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Created" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="viewResponse(row)">
                Response
              </el-button>
              <el-button type="danger" size="small" @click="viewError(row)">
                Error
              </el-button>
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

    <el-dialog
      v-model="showResponseDialog"
      title="Response Details"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedLog">
        <h4>Request Meta:</h4>
        <MonacoEditor
          v-model="requestMetaText"
          language="json"
          theme="vs-light"
          :height="200"
        />
        <h4 class="mt-4">Response:</h4>
        <MonacoEditor
          v-model="responseText"
          language="json"
          theme="vs-light"
          :height="300"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="showErrorDialog"
      title="Error Details"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedLog">
        <h4>Error Information:</h4>
        <MonacoEditor
          v-model="errorText"
          language="json"
          theme="vs-light"
          :height="400"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { useRequestLogStore } from "@/stores/request-log.store";
import type { RequestLog } from "@/types/request-log.types";
import Pagination from "@/components/common/Pagination.vue";
import MonacoEditor from "@/components/common/MonacoEditor.vue";
import { formatJSON } from "@/utils/json.helpers";

const requestLogStore = useRequestLogStore();

const currentPage = ref(1);
const pageSize = ref(10);
const showResponseDialog = ref(false);
const showErrorDialog = ref(false);
const selectedLog = ref<RequestLog | null>(null);

const logs = computed(() => requestLogStore.logs);
const pagination = computed(() => requestLogStore.pagination);
const loading = computed(() => requestLogStore.loading);

const requestMetaText = ref("");
const responseText = ref("");
const errorText = ref("");

onMounted(async () => {
  await fetchLogs();
});

async function fetchLogs() {
  try {
    await requestLogStore.fetchRequestLogs(currentPage.value, pageSize.value);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
}

async function refreshLogs() {
  await fetchLogs();
}

async function handlePageChange(page: number) {
  currentPage.value = page;
  await fetchLogs();
}

async function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  await fetchLogs();
}

function getMethodTagType(method: string): string {
  const methodTypes: Record<string, string> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
  };
  return methodTypes[method.toUpperCase()] || "info";
}

function getStatusTagType(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "warning";
  if (statusCode >= 400 && statusCode < 500) return "danger";
  if (statusCode >= 500) return "danger";
  return "info";
}

function formatDuration(duration: number): string {
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function viewResponse(log: RequestLog) {
  selectedLog.value = log;
  requestMetaText.value = formatJSON(log.requestMeta);
  responseText.value = formatJSON(log.responseBody);
  showResponseDialog.value = true;
}

function viewError(log: RequestLog) {
  selectedLog.value = log;
  errorText.value = formatJSON(log.error);
  showErrorDialog.value = true;
}
</script>

<style scoped>
.request-logs-view {
  padding: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
