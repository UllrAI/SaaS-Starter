"use client";

import type { ReactNode } from "react";
import {
  FileArchive,
  FileAudio,
  FileIcon,
  FileText,
  FileVideo,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { formatFileSize, UPLOAD_CONFIG } from "@/lib/config/upload";
import {
  useFileUpload,
  type UseFileUploadOptions,
  type UseFileUploadResult,
} from "./file-upload/use-file-upload";
import type { FileUploadIssue, FileUploadItem } from "./file-upload/types";

function getFileTypeIcon(contentType: string) {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className="h-5 w-5" />;
  }

  if (contentType.startsWith("video/")) {
    return <FileVideo className="h-5 w-5" />;
  }

  if (contentType.startsWith("audio/")) {
    return <FileAudio className="h-5 w-5" />;
  }

  if (
    contentType.startsWith("application/zip") ||
    contentType.includes("compressed")
  ) {
    return <FileArchive className="h-5 w-5" />;
  }

  if (contentType === "application/pdf" || contentType.startsWith("text/")) {
    return <FileText className="h-5 w-5" />;
  }

  return <FileIcon className="h-5 w-5" />;
}

function IssueMessage({ issue }: { issue: FileUploadIssue }) {
  switch (issue.code) {
    case "too-many-files":
      return <>You can upload up to {issue.maxFiles} file(s) at a time.</>;
    case "file-type-not-accepted":
      return (
        <>
          {issue.fileName} does not match the allowed upload preset for this
          section.
        </>
      );
    case "file-type-not-supported":
      return <>This app does not support {issue.contentType} uploads.</>;
    case "file-too-large":
      return (
        <>
          {issue.fileName} is {formatFileSize(issue.fileSize ?? 0)}. The preset
          limit is {formatFileSize(issue.maxFileSize ?? 0)}.
        </>
      );
    case "file-too-large-for-app":
      return (
        <>
          {issue.fileName} exceeds the app-wide limit of{" "}
          {formatFileSize(issue.maxFileSize ?? 0)}.
        </>
      );
    case "unsafe-upload-url":
      return (
        <>The upload destination was rejected by the client safety checks.</>
      );
    case "request-failed":
      return <>The upload request could not be completed. Please try again.</>;
    case "network-error":
      return <>The network connection dropped during upload.</>;
    case "upload-aborted":
      return <>The upload was canceled before it finished.</>;
    case "upload-preparation-failed":
      return <>The file could not be prepared for upload.</>;
    case "upload-failed":
      return <>The file upload failed before completion.</>;
  }
}

function QueueStatusBadge({ item }: { item: FileUploadItem }) {
  if (item.status === "success") {
    return <Badge variant="secondary">Uploaded</Badge>;
  }

  if (item.status === "uploading") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Uploading
      </Badge>
    );
  }

  if (item.status === "error") {
    return <Badge variant="destructive">Needs attention</Badge>;
  }

  if (item.status === "canceled") {
    return <Badge variant="outline">Canceled</Badge>;
  }

  return <Badge variant="outline">Queued</Badge>;
}

function QueueStatusText({ item }: { item: FileUploadItem }) {
  if (item.status === "success") {
    return <>Uploaded</>;
  }

  if (item.status === "uploading") {
    return <>{item.progress}%</>;
  }

  if (item.status === "error") {
    return <>Needs attention</>;
  }

  if (item.status === "canceled") {
    return <>Canceled</>;
  }

  return <>Queued</>;
}

function FilePreview({ item }: { item: FileUploadItem }) {
  if (!item.previewUrl) {
    return (
      <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-2xl">
        {getFileTypeIcon(item.file.type)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.previewUrl}
      alt={item.file.name}
      className="h-14 w-14 rounded-2xl border object-cover"
    />
  );
}

function ImageQueueTile({
  item,
  onCancel,
  onRemove,
  onRetry,
}: {
  item: FileUploadItem;
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="bg-muted relative aspect-square overflow-hidden rounded-xl border">
      {item.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-full w-full object-cover"
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent p-3 text-white">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{item.file.name}</p>
            <p className="text-[11px] text-white/80">
              <QueueStatusText item={item} />
            </p>
          </div>

          {item.status === "success" ? (
            <Badge variant="secondary">Done</Badge>
          ) : null}
        </div>

        {item.status === "uploading" ? (
          <Progress value={item.progress} className="mt-2 h-1.5 bg-white/20" />
        ) : null}
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        {item.status === "uploading" ? (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}

        {(item.status === "error" || item.status === "canceled") && (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onRetry}
            aria-label="Retry upload"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {item.issue ? (
        <div className="bg-background/90 absolute inset-x-2 bottom-2 rounded-md p-2 text-[11px] text-red-600">
          <IssueMessage issue={item.issue} />
        </div>
      ) : null}
    </div>
  );
}

function FileQueueItem({
  item,
  onCancel,
  onRemove,
  onRetry,
}: {
  item: FileUploadItem;
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="bg-background flex items-start gap-3 rounded-lg border p-3">
      <FilePreview item={item} />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {item.file.name}
          </p>
          <QueueStatusBadge item={item} />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span>{formatFileSize(item.file.size)}</span>
          <span>•</span>
          <span className="truncate">{item.file.type}</span>
        </div>

        {item.status === "uploading" && (
          <div className="space-y-1">
            <Progress value={item.progress} className="h-2" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Uploading now</span>
              <span>{item.progress}%</span>
            </div>
          </div>
        )}

        {item.issue && (
          <p className="text-xs text-red-600">
            <IssueMessage issue={item.issue} />
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {item.status === "uploading" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}

        {(item.status === "error" || item.status === "canceled") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            aria-label="Retry upload"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export interface FileUploaderProps extends UseFileUploadOptions {
  children?: (uploader: UseFileUploadResult) => ReactNode;
  className?: string;
}

export function FileUploader({
  children,
  className,
  ...options
}: FileUploaderProps) {
  const uploader = useFileUpload(options);

  if (children) {
    return <>{children(uploader)}</>;
  }

  const allFormatsEnabled =
    (options.acceptedFileTypes ?? UPLOAD_CONFIG.ALLOWED_FILE_TYPES).length ===
    UPLOAD_CONFIG.ALLOWED_FILE_TYPES.length;
  const completedCount = uploader.items.filter(
    (item) => item.status === "success",
  ).length;
  const showImageGrid =
    uploader.items.length > 0 &&
    uploader.items.every((item) => Boolean(item.previewUrl));

  return (
    <div className={cn("space-y-4", className)}>
      <input {...uploader.getInputProps({ className: "hidden" })} />

      {!showImageGrid ? (
        <div
          {...uploader.getRootProps({
            className: cn(
              "rounded-xl border border-dashed p-4 transition-colors",
              "hover:border-primary/50",
              uploader.isDragActive && "border-primary bg-muted/50",
            ),
          })}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  <span>Drop files here or click to browse</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Up to {options.maxFiles ?? 1} file(s), max{" "}
                  {formatFileSize(
                    options.maxFileSize ?? UPLOAD_CONFIG.MAX_FILE_SIZE,
                  )}
                  .{" "}
                  {allFormatsEnabled ? (
                    <>All supported formats.</>
                  ) : (
                    <>Preset formats only.</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    uploader.openFileDialog();
                  }}
                  disabled={!uploader.canAddMore}
                >
                  <Upload className="h-4 w-4" />
                  {uploader.items.length > 0 ? (
                    <>Add files</>
                  ) : (
                    <>Select files</>
                  )}
                </Button>

                {!uploader.autoUpload && uploader.items.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      void uploader.uploadAll();
                    }}
                  >
                    Start upload
                  </Button>
                ) : null}

                {completedCount > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      uploader.clearCompleted();
                    }}
                  >
                    Clear completed
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {uploader.items.map((item) => (
              <ImageQueueTile
                key={item.id}
                item={item}
                onCancel={() => uploader.cancelFile(item.id)}
                onRemove={() => uploader.removeFile(item.id)}
                onRetry={() => {
                  void uploader.retryFile(item.id);
                }}
              />
            ))}

            {uploader.canAddMore ? (
              <div
                {...uploader.getRootProps({
                  className: cn(
                    "text-muted-foreground hover:border-primary/50 hover:text-foreground flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors",
                    uploader.isDragActive && "border-primary bg-muted/50",
                  ),
                })}
              >
                <Upload className="mb-2 h-5 w-5" />
                <p className="text-sm font-medium">Upload</p>
                <p className="mt-1 text-xs">
                  {uploader.items.length + 1}-
                  {Math.max(options.maxFiles ?? 1, uploader.items.length + 1)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!uploader.autoUpload && uploader.items.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void uploader.uploadAll();
                }}
              >
                Start upload
              </Button>
            ) : null}

            {completedCount > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  uploader.clearCompleted();
                }}
              >
                Clear completed
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {uploader.issue ? (
        <Alert variant="destructive">
          <AlertDescription>
            <IssueMessage issue={uploader.issue} />
          </AlertDescription>
        </Alert>
      ) : null}

      {uploader.items.length > 0 && !showImageGrid ? (
        <div className="space-y-3">
          {uploader.items.map((item) => (
            <FileQueueItem
              key={item.id}
              item={item}
              onCancel={() => uploader.cancelFile(item.id)}
              onRemove={() => uploader.removeFile(item.id)}
              onRetry={() => {
                void uploader.retryFile(item.id);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { useFileUpload };
export type {
  FileUploadIssue,
  FileUploadItem,
  FileUploadItemStatus,
  UploadedFile,
  UploadTransport,
} from "./file-upload/types";
