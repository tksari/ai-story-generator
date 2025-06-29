import { inject, injectable } from "tsyringe";
import { JobRepository } from "@/domain/job/job.repository";
import { LogService } from "@/infrastructure/logging/log.service";
import { Job, JobStatus, JobType } from "@prisma/client";
import { EventEmitterService } from "@/infrastructure/redis/event-emitter.service";
import { EVENT_CHANNELS } from "@/constants/event";
import { CreateJobParams, UpdateJobParams } from "@/domain/job/job.types";
import { generateTaskId } from "@/domain/job/job.utils";
import { HttpError } from "@/middleware/error-handler";

@injectable()
export class JobService {
  constructor(
    @inject("JobRepository") private jobRepository: JobRepository,
    @inject("LogService") private logService: LogService,
    @inject("EventEmitterService") private eventEmitter: EventEmitterService
  ) {}

  private async emitJobEvent(job: Job, status: JobStatus): Promise<void> {
    await this.eventEmitter.emit(
      `${EVENT_CHANNELS.JOB}:${job.id}`,
      `${EVENT_CHANNELS.JOB}:${status}`,
      {
        taskId: job.taskId,
        type: job.type,
        status: job.status,
      }
    );
  }

  private logError(operation: string, error: unknown): void {
    this.logService.error(
      `Error ${operation}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  async getJobByTaskId(taskId: string): Promise<Job | null> {
    return this.jobRepository.getJobByTaskId(taskId);
  }

  private prepareJobParams(params: CreateJobParams): CreateJobParams {
    return {
      ...params,
      taskId: params.taskId || generateTaskId(),
      status: JobStatus.PENDING,
    };
  }

  async createJob(params: CreateJobParams): Promise<Job> {
    try {
      const job = await this.jobRepository.create(this.prepareJobParams(params));
      this.logService.info(`Created job: ${job.taskId}, type: ${job.type}, status: ${job.status}`);
      await this.emitJobEvent(job, JobStatus.PENDING);
      return job;
    } catch (error) {
      this.logError("creating job", error);
      throw error;
    }
  }

  async createJobMany(params: CreateJobParams[]): Promise<Job[]> {
    try {
      const jobs = await this.jobRepository.createJobMany(
        params.map((param) => this.prepareJobParams(param))
      );
      this.logService.info(`Created ${jobs.length} jobs`);

      await Promise.allSettled(
        jobs.map((job) =>
          this.emitJobEvent(job, JobStatus.PENDING).catch((error) => {
            this.logError(`emitting event for job ${job.taskId}`, error);
          })
        )
      );

      return jobs;
    } catch (error) {
      this.logError("creating multiple jobs", error);
      throw error;
    }
  }

  async updateJob(taskId: string, params: UpdateJobParams): Promise<Job> {
    try {
      const job = await this.jobRepository.update(taskId, params);
      this.logService.info(`Updated job: ${taskId}, status: ${job.status}`);
      await this.emitJobEvent(job, JobStatus.IN_PROGRESS);
      return job;
    } catch (error) {
      this.logError("updating job", error);
      throw error;
    }
  }

  async deleteJob(taskId: string): Promise<Job> {
    try {
      const job = await this.jobRepository.delete(taskId);
      this.logService.info(`Deleted job: ${taskId}`);
      return job;
    } catch (error) {
      this.logError("deleting job", error);
      throw error;
    }
  }

  async getJobs(page = 1, pageSize = 10): Promise<{ jobs: Job[]; total: number }> {
    return this.jobRepository.getJobs(page, pageSize);
  }

  async getJobsByStoryId(storyId: number): Promise<Job[]> {
    return this.jobRepository.getJobsByStoryId(storyId);
  }

  async deleteJobsByStoryId(storyId: number): Promise<number> {
    try {
      const count = await this.jobRepository.deleteJobsByStoryId(storyId);
      this.logService.info(`Deleted ${count} jobs for story ID: ${storyId}`);
      return count;
    } catch (error) {
      this.logError(`deleting jobs for story ID ${storyId}`, error);
      throw error;
    }
  }

  async assertNoActiveJob(storyId: number, types: JobType[]) {
    const exists = await this.jobRepository.findAnyActiveJobByStoryIdAndTypes(storyId, types);
    if (exists) {
      throw new HttpError(400, `${exists.type} generation job already in progress`);
    }
  }

  async getJobStats(): Promise<any> {
    return this.jobRepository.getJobStats();
  }

  async startJob(params: CreateJobParams): Promise<Job> {
    return this.createJob({
      ...params,
      type: params.type,
      status: JobStatus.IN_PROGRESS,
    });
  }

  async completeJob(taskId: string, result?: Record<string, any>): Promise<Job> {
    const job = await this.updateJob(taskId, {
      status: JobStatus.DONE,
      result,
    });

    this.logService.info(`Completed job: ${taskId}, status: ${job.status}`);
    await this.emitJobEvent(job, JobStatus.DONE);

    return job;
  }

  async failJob(taskId: string, error: string, metadata?: Record<string, any>): Promise<Job> {
    return this.updateJob(taskId, {
      status: JobStatus.FAILED,
      error,
      completedAt: new Date(),
      metadata,
    });
  }

  async updateJobProgress(taskId: string, metadata?: Record<string, any>): Promise<Job> {
    return this.updateJob(taskId, { metadata });
  }
}
