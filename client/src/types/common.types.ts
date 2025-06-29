export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  FAILED = "FAILED",
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
