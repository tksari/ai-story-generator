import { randomBytes } from "crypto";

export function generateTaskId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString("hex");
  return `task_${timestamp}_${random}`;
}
