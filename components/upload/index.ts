// Main exports for the upload component system
export { FileUploader } from "./file-uploader";
export { FilePreview } from "./file-preview";
export { FileItem } from "./file-item";
export { UploadDropZone } from "./upload-drop-zone";

// Hook exports
export { useFileUpload } from "./hooks/use-file-upload";
export { useFileValidation } from "./hooks/use-file-validation";
export { useFilePreview } from "./hooks/use-file-preview";

// Utility exports
export {
  generateFileId,
  getFileTypeIcon,
  processAndPreviewFile,
  createFileWithPreview,
} from "./utils/file-processing";
export {
  getPresignedUrl,
  uploadFileWithProgress,
  uploadFile,
} from "./utils/upload-api";

// Type exports
export type {
  FileWithPreview,
  UploadedFile,
  FileUploadState,
  ProcessedFileResult,
  FileValidationError,
  FileUploaderProps,
} from "./types";