import { Job } from "@/types/job.types";
import { api } from "./api";
import { Pagination } from "@/types/common.types";

export const jobService = {
  async getJobs(
    page = 1,
    pageSize = 10,
  ): Promise<{ jobs: Job[]; pagination: Pagination }> {
    const response = await api.get("/jobs", {
      params: { page, pageSize },
    });

    return response.data;
  },

  async deleteJob(taskId: string): Promise<void> {
    await api.delete(`/jobs/${taskId}`);
  },

  async getActiveJobByStoryAndType(
    storyId: number,
    type: string,
  ): Promise<Job> {
    const response = await api.get("/jobs/active", {
      params: { storyId, type },
    });
    return response.data;
  },
};
