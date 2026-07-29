"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
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
  const { t } = useTranslation();
  switch (issue.code) {
    case "too-many-files":
      return (
        <>
          {t(
            "uploads_you_can_upload_up_file_s",
            "You can upload up to {expression0} file(s) at a time.",
            {
              expression0: issue.maxFiles,
            },
          )}
        </>
      );
    case "file-type-not-accepted":
      return (
        <>
          {t(
            "uploads_does_not_match_allowed_upload_preset",
            "{expression0} does not match the allowed upload preset for this section.",
            {
              expression0: issue.fileName,
            },
          )}
        </>
      );
    case "file-type-not-supported":
      return (
        <>
          {t(
            "uploads_app_does_not_support_uploads",
            "This app does not support {expression0} uploads.",
            {
              expression0: issue.contentType,
            },
          )}
        </>
      );
    case "file-too-large":
      return (
        <>
          {t(
            "uploads_preset_limit",
            "{expression0} is {expression1}. The preset limit is {expression2}.",
            {
              expression0: issue.fileName,
              expression1: formatFileSize(issue.fileSize ?? 0),
              expression2: formatFileSize(issue.maxFileSize ?? 0),
            },
          )}
        </>
      );
    case "file-too-large-for-app":
      return (
        <>
          {t(
            "uploads_exceeds_app_wide_limit",
            "{expression0} exceeds the app-wide limit of {expression1}.",
            {
              expression0: issue.fileName,
              expression1: formatFileSize(issue.maxFileSize ?? 0),
            },
          )}
        </>
      );
    case "upload-quota-exceeded":
      return (
        <>
          {t(
            "uploadQuotaExceeded",
            "Your upload quota has been reached. Remove files or try again later.",
          )}
        </>
      );
    case "unsafe-upload-url":
      return (
        <>
          {t(
            "uploads_upload_destination_was_rejected_client_safety",
            "The upload destination was rejected by the client safety checks.",
          )}
        </>
      );
    case "request-failed":
      return (
        <>
          {t(
            "uploads_upload_request_could_not_completed_please",
            "The upload request could not be completed. Please try again.",
          )}
        </>
      );
    case "network-error":
      return (
        <>
          {t(
            "uploads_network_connection_dropped_during_upload",
            "The network connection dropped during upload.",
          )}
        </>
      );
    case "upload-aborted":
      return (
        <>
          {t(
            "uploads_upload_was_canceled_before_it_finished",
            "The upload was canceled before it finished.",
          )}
        </>
      );
    case "upload-preparation-failed":
      return (
        <>
          {t(
            "uploads_file_could_not_prepared_upload",
            "The file could not be prepared for upload.",
          )}
        </>
      );
    case "upload-failed":
      return (
        <>
          {t(
            "uploads_file_upload_failed_before_completion",
            "The file upload failed before completion.",
          )}
        </>
      );
  }
}
function QueueStatusBadge({ item }: { item: FileUploadItem }) {
  const { t } = useTranslation();
  if (item.status === "success") {
    return (
      <Badge variant="secondary">{t("uploads_uploaded", "Uploaded")}</Badge>
    );
  }
  if (item.status === "uploading") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("uploads_uploading", "Uploading")}
      </Badge>
    );
  }
  if (item.status === "error") {
    return (
      <Badge variant="destructive">
        {t("uploads_needs_attention", "Needs attention")}
      </Badge>
    );
  }
  if (item.status === "canceled") {
    return <Badge variant="outline">{t("uploads_canceled", "Canceled")}</Badge>;
  }
  return <Badge variant="outline">{t("uploads_queued", "Queued")}</Badge>;
}
function QueueStatusText({ item }: { item: FileUploadItem }) {
  const { t } = useTranslation();
  if (item.status === "success") {
    return <>{t("uploads_uploaded", "Uploaded")}</>;
  }
  if (item.status === "uploading") {
    return (
      <>
        {t("uploads_progress_percent", "{expression0}%", {
          expression0: item.progress,
        })}
      </>
    );
  }
  if (item.status === "error") {
    return <>{t("uploads_needs_attention", "Needs attention")}</>;
  }
  if (item.status === "canceled") {
    return <>{t("uploads_canceled", "Canceled")}</>;
  }
  return <>{t("uploads_queued", "Queued")}</>;
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
  const { t } = useTranslation();
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
            <Badge variant="secondary">{t("uploads_done", "Done")}</Badge>
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
            aria-label={t("uploads_cancel_upload", "Cancel upload")}
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
            aria-label={t("uploads_retry_upload", "Retry upload")}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onRemove}
          aria-label={t("uploads_remove_file", "Remove file")}
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
  const { t } = useTranslation();
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
          <span>{t("uploads_file_metadata_separator", "\u2022")}</span>
          <span className="truncate">{item.file.type}</span>
        </div>

        {item.status === "uploading" && (
          <div className="space-y-1">
            <Progress value={item.progress} className="h-2" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("uploads_uploading_now", "Uploading now")}</span>
              <span>
                {t("uploads_progress_percent", "{expression0}%", {
                  expression0: item.progress,
                })}
              </span>
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
            aria-label={t("uploads_cancel_upload", "Cancel upload")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}

        {(item.status === "error" || item.status === "canceled") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            aria-label={t("uploads_retry_upload", "Retry upload")}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={t("uploads_remove_file", "Remove file")}
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
  const { t } = useTranslation();
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
      <input
        {...uploader.getInputProps({
          className: "hidden",
        })}
      />

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
                  <span>
                    {t(
                      "uploads_drop_files_here_click_browse",
                      "Drop files here or click to browse",
                    )}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t(
                    "uploads_up_file_s_max",
                    "Up to {expression0} file(s), max {expression1} . {expression2}",
                    {
                      expression0: options.maxFiles ?? 1,
                      expression1: formatFileSize(
                        options.maxFileSize ?? UPLOAD_CONFIG.MAX_FILE_SIZE,
                      ),
                      expression2: allFormatsEnabled ? (
                        <>
                          {t(
                            "upload_all_supported_formats",
                            "All supported formats.",
                          )}
                        </>
                      ) : (
                        <>
                          {t(
                            "upload_preset_formats_only",
                            "Preset formats only.",
                          )}
                        </>
                      ),
                    },
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
                    <>{t("uploads_add_files", "Add files")}</>
                  ) : (
                    <>{t("uploads_select_files", "Select files")}</>
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
                    {t("uploads_start_upload", "Start upload")}
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
                    {t("uploads_clear_completed", "Clear completed")}
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
                <p className="text-sm font-medium">
                  {t("uploads_upload", "Upload")}
                </p>
                <p className="mt-1 text-xs">
                  {t("uploads_slot_range", "{expression0}- {expression1}", {
                    expression0: uploader.items.length + 1,
                    expression1: Math.max(
                      options.maxFiles ?? 1,
                      uploader.items.length + 1,
                    ),
                  })}
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
                {t("uploads_start_upload", "Start upload")}
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
                {t("uploads_clear_completed", "Clear completed")}
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
export type { UploadedFile } from "./file-upload/types";
