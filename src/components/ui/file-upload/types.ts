export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  contentType: string;
  fileName: string;
}

export type FileUploadIssueCode =
  | "too-many-files"
  | "file-type-not-accepted"
  | "file-type-not-supported"
  | "file-too-large"
  | "file-too-large-for-app"
  | "upload-preparation-failed"
  | "unsafe-upload-url"
  | "request-failed"
  | "network-error"
  | "upload-aborted"
  | "upload-failed";

export interface FileUploadIssue {
  code: FileUploadIssueCode;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  maxFileSize?: number;
  maxFiles?: number;
}

export class FileUploadIssueError extends Error {
  constructor(readonly issue: FileUploadIssue) {
    super(issue.code);
    this.name = "FileUploadIssueError";
  }
}

export type FileUploadItemStatus =
  | "queued"
  | "uploading"
  | "success"
  | "error"
  | "canceled";

export interface FileUploadItem {
  id: string;
  file: File;
  previewUrl?: string;
  progress: number;
  status: FileUploadItemStatus;
  issue?: FileUploadIssue;
  uploadedFile?: UploadedFile;
}

export interface UploadTask {
  promise: Promise<UploadedFile>;
  cancel?: () => void;
}

export interface UploadTransport {
  startUpload(args: {
    file: File;
    onProgress: (progress: number) => void;
  }): UploadTask;
}
