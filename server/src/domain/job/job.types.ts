import { Job } from "@prisma/client";
import { JobType } from "@prisma/client";

export type JobUpdatableFields = Partial<Omit<Job, "id" | "createdAt" | "updatedAt">>;

export interface CreateJobParams extends JobUpdatableFields {
  type: JobType;
}

export interface UpdateJobParams extends JobUpdatableFields {}
