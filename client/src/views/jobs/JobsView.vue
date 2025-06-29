<template>
  <div class="jobs-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>Jobs</h2>
        </div>
      </template>
      <el-table
        :data="jobStore.jobs"
        v-loading="jobStore.loading"
        style="width: 100%"
      >
        <el-table-column prop="taskId" label="Task ID" min-width="220" />
        <el-table-column prop="type" label="Type" width="100" />
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Created" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120">
          <template #default="{ row }">
            <el-tooltip content="View Queue Logs" placement="top">
              <el-button
                type="primary"
                :icon="View"
                circle
                @click="handleViewLog(row.taskId)"
              />
            </el-tooltip>
            <el-tooltip content="Delete Job" placement="top">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="handleDelete(row.taskId)"
                :loading="deletingTaskId === row.taskId"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <Pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="jobStore.pagination.total"
          @update:current-page="handlePageChange"
          @update:page-size="handleSizeChange"
        />
      </div>
      <el-alert
        v-if="jobStore.error"
        :title="jobStore.error"
        type="error"
        show-icon
        class="mt-4"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useJobStore } from "@/stores/job.store";
import { Delete, View } from "@element-plus/icons-vue";
import { showAlert, showConfirm } from "@/utils/message-box.helper.ts";
import Pagination from "@/components/common/Pagination.vue";
import { getStatusType } from "@/utils/status.helper";

const jobStore = useJobStore();
const deletingTaskId = ref("");

const currentPage = ref(1);
const pageSize = ref(10);

const fetchJobs = async () => {
  try {
    await jobStore.fetchJobs(currentPage.value, pageSize.value);
  } catch (err) {
    if (jobStore.error) {
      ElMessage.error(jobStore.error);
    }
  }
};

const handleDelete = async (taskId: string) => {
  try {
    await showConfirm("Are you sure you want to delete this job?", {
      title: "Delete Confirmation",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    deletingTaskId.value = taskId;
    try {
      await jobStore.deleteJob(taskId);
      ElMessage.success("Job deleted successfully!");
      await fetchJobs();
    } catch (err) {
      if (jobStore.error) {
        ElMessage.error(jobStore.error);
      }
    } finally {
      deletingTaskId.value = "";
    }
  } catch {}
};

const handleViewLog = async (taskId: string) => {
  const job = jobStore.jobs.find((j) => j.taskId === taskId);
  if (!job) return;

  if (job.error) {
    showAlert(job.error, {
      title: "Job Error",
      type: "error",
    });
  } else {
    showAlert("No error found for this job.", {
      title: "Job Log",
      confirmButtonText: "OK",
      type: "info",
    });
  }
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchJobs();
};

const handleSizeChange = async (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  await fetchJobs();
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

onMounted(fetchJobs);
</script>

<style scoped>
.jobs-view {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
