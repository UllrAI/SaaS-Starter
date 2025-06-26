// Upload component type definitions

export interface FileWithPreview extends File {
  preview?: string;
  _id?: string;
}

export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  contentType: string;
  fileName: string;
}

export interface FileUploadState {
  file: FileWithPreview;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  uploadedFile?: UploadedFile;
  id: string;
}

export interface ProcessedFileResult {
  file: File;
  preview?: string;
}

export interface FileValidationError {
  file: File;
  error: string;
}

export interface FileUploaderProps {
  acceptedFileTypes?: readonly string[];
  maxFileSize?: number;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  className?: string;
  disabled?: boolean;
  enableImageCompression?: boolean;
  imageCompressionQuality?: number;
  imageCompressionMaxWidth?: number;
  imageCompressionMaxHeight?: number;
}