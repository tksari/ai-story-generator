import { TaskStatus } from "@/types/common.types";

export function getStatusType(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DONE:
      return "success";
    case TaskStatus.IN_PROGRESS:
      return "warning";
    case TaskStatus.FAILED:
      return "danger";
    case TaskStatus.PENDING:
      return "info";
    default:
      return "info";
  }
}

export function isProcessing(status: TaskStatus) {
  return (
    status === TaskStatus.IN_PROGRESS ||
    status === TaskStatus.PENDING ||
    status === TaskStatus.FAILED
  );
}

export function isCompleted(status: TaskStatus) {
  return status === TaskStatus.DONE;
}

export function isFailed(status: TaskStatus) {
  return status === TaskStatus.FAILED;
}

export function hasAccessAction(status: TaskStatus) {
  return isCompleted(status);
}

export function hasAccessDelete(status: TaskStatus) {
  return isCompleted(status) || isFailed(status);
}

export function getProgressInfo(item: any): any {
  if (item.status === TaskStatus.IN_PROGRESS) {
    if (item.progress) {
      return {
        percentage: item.progress ?? 0,
        message: item.progress?.message ?? "",
        status: "",
      };
    }
  }

  if (item.status === TaskStatus.DONE) {
    return {
      percentage: 100,
      message: `Generation completed`,
      status: "success",
    };
  }

  if (item.status === TaskStatus.FAILED) {
    return {
      percentage: 0,
      message: `Generation failed`,
      status: "exception",
    };
  }

  return {
    percentage: 0,
    message: "Queued for generation...",
    status: "warning",
  };
}
