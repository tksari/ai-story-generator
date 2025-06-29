import { JsonValue } from "@prisma/client/runtime/library";

export interface GeneratedImage {
  id: number;
  pageId: number;
  prompt?: string | null;
  path: string | null;
  status?: string;
  isDefault: boolean;
  metadata: JsonValue;
  createdAt?: Date;
  updatedAt?: Date;
}
