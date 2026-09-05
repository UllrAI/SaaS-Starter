import "server-only";
import { db } from "@/database";
import env from "@/env";
import { getUploadConfig } from "@/lib/config/integrations";
import { createFileStorage } from "./store";

let storage: ReturnType<typeof createFileStorage> | undefined;

export const storeFile = (
  input: Parameters<ReturnType<typeof createFileStorage>>[0],
) => {
  storage ??= createFileStorage(db, {
    ...getUploadConfig(),
    UPLOAD_DAILY_QUOTA_BYTES: env.UPLOAD_DAILY_QUOTA_BYTES,
    UPLOAD_TOTAL_QUOTA_BYTES: env.UPLOAD_TOTAL_QUOTA_BYTES,
  });
  return storage(input);
};
