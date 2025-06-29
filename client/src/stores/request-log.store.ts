import { defineStore } from "pinia";
import { ref } from "vue";
import { requestLogService } from "@/services/request-log.service";
import type { RequestLog } from "@/types/request-log.types";
import { Pagination } from "@/types/common.types";

export const useRequestLogStore = defineStore("requestLog", () => {
  const logs = ref<RequestLog[]>([]);
  const pagination = ref<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRequestLogs(page = 1, pageSize = 10) {
    loading.value = true;
    error.value = null;

    try {
      const response = await requestLogService.getRequestLogs(page, pageSize);
      logs.value = response.logs;
      pagination.value = response.pagination;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch request logs";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRequestLogById(id: number): Promise<RequestLog> {
    try {
      return await requestLogService.getRequestLogById(id);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch request log";
      throw err;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    logs,
    pagination,
    loading,
    error,
    fetchRequestLogs,
    fetchRequestLogById,
    clearError,
  };
});
