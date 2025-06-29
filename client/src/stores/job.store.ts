import { defineStore } from "pinia";
import { ref } from "vue";
import { jobService } from "../services/job.service";
import { Job } from "@/types/job.types";
import { Pagination } from "@/types/common.types";

export const useJobStore = defineStore("job", () => {
  const jobs = ref<Job[]>([]);
  const pagination = ref<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchJobs(page = 1, pageSize = 10) {
    loading.value = true;
    error.value = null;
    try {
      const response = await jobService.getJobs(page, pageSize);
      jobs.value = response.jobs;
      pagination.value = response.pagination;
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Failed to fetch jobs";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteJob(taskId: string) {
    loading.value = true;
    error.value = null;
    try {
      await jobService.deleteJob(taskId);
      jobs.value = jobs.value.filter((j) => j.taskId !== taskId);
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Failed to delete job";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getActiveJobByStoryAndType(
    storyId: number,
    type: string,
  ): Promise<Job> {
    try {
      return await jobService.getActiveJobByStoryAndType(storyId, type);
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Failed to get active job";
      throw err;
    }
  }

  return {
    jobs,
    loading,
    error,
    pagination,
    fetchJobs,
    deleteJob,
    getActiveJobByStoryAndType,
  };
});
