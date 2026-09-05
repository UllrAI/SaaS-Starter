import { db } from "@/database";
import env from "@/env";
import { buildFileUrl } from "./url";
import { deleteFile } from "@/lib/r2";
import { createUploadRepository } from "./repository";
export {
  UploadQuotaExceededError,
  UploadIntentUnavailableError,
  UploadMetadataMismatchError,
} from "./repository";
export const {
  createUploadIntent,
  releaseUploadIntent,
  cancelUploadIntent,
  completeUploadIntent,
  completeLegacyUpload,
  cleanupExpiredUploadIntents,
  recoverStaleUploadCleanupClaims,
} = createUploadRepository(db, env, buildFileUrl, deleteFile);
