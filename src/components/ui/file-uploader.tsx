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
            "d666b4ae8dee",
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
            "0d1e07a822f3",
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
            "5f4fd6cfd1ca",
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
            "dd1645efa849",
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
            "813c9ca81612",
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
            "2ad00125294d",
            "The upload destination was rejected by the client safety checks.",
          )}
        </>
      );
    case "request-failed":
      return (
        <>
          {t(
            "36443a7c5631",
            "The upload request could not be completed. Please try again.",
          )}
        </>
      );
    case "network-error":
      return (
        <>
          {t("d4efb0956981", "The network connection dropped during upload.")}
        </>
      );
    case "upload-aborted":
      return (
        <>{t("e0a0c121384e", "The upload was canceled before it finished.")}</>
      );
    case "upload-preparation-failed":
      return (
        <>{t("bf902011e250", "The file could not be prepared for upload.")}</>
      );
    case "upload-failed":
      return (
        <>{t("26f5a55d6d06", "The file upload failed before completion.")}</>
      );
  }
}
function QueueStatusBadge({ item }: { item: FileUploadItem }) {
  const { t } = useTranslation();
  if (item.status === "success") {
    return <Badge variant="secondary">{t("da8f2ecc6829", "Uploaded")}</Badge>;
  }
  if (item.status === "uploading") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("8908b85bafa7", "Uploading")}
      </Badge>
    );
  }
  if (item.status === "error") {
    return (
      <Badge variant="destructive">
        {t("91e86dda4fde", "Needs attention")}
      </Badge>
    );
  }
  if (item.status === "canceled") {
    return <Badge variant="outline">{t("23e49bb9d683", "Canceled")}</Badge>;
  }
  return <Badge variant="outline">{t("2f449662f8be", "Queued")}</Badge>;
}
function QueueStatusText({ item }: { item: FileUploadItem }) {
  const { t } = useTranslation();
  if (item.status === "success") {
    return <>{t("dc604786445b", "Uploaded")}</>;
  }
  if (item.status === "uploading") {
    return (
      <>
        {t("417ed0f83446", "{expression0}%", {
          expression0: item.progress,
        })}
      </>
    );
  }
  if (item.status === "error") {
    return <>{t("4b3884a9f0b2", "Needs attention")}</>;
  }
  if (item.status === "canceled") {
    return <>{t("59a74efd432b", "Canceled")}</>;
  }
  return <>{t("13ba0ad725bc", "Queued")}</>;
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
            <Badge variant="secondary">{t("f08ec26ccfc0", "Done")}</Badge>
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
            aria-label={t("4d9d396c901b", "Cancel upload")}
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
            aria-label={t("e830b539c500", "Retry upload")}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onRemove}
          aria-label={t("78ab1b75517f", "Remove file")}
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
          <span>{t("7a0ed5b4d738", "\u2022")}</span>
          <span className="truncate">{item.file.type}</span>
        </div>

        {item.status === "uploading" && (
          <div className="space-y-1">
            <Progress value={item.progress} className="h-2" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("6c889bf8964e", "Uploading now")}</span>
              <span>
                {t("af3417bcc17b", "{expression0}%", {
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
            aria-label={t("905670e48293", "Cancel upload")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}

        {(item.status === "error" || item.status === "canceled") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            aria-label={t("521f47e10724", "Retry upload")}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={t("9b6759861929", "Remove file")}
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
                    {t("1f7626a0d29a", "Drop files here or click to browse")}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t(
                    "152777e6bb3c",
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
                    <>{t("838e02ccc51a", "Add files")}</>
                  ) : (
                    <>{t("3280ea8b83dc", "Select files")}</>
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
                    {t("ee521d6bd908", "Start upload")}
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
                    {t("53afa8ae2618", "Clear completed")}
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
                  {t("700d33112f6e", "Upload")}
                </p>
                <p className="mt-1 text-xs">
                  {t("e05962b1488c", "{expression0}- {expression1}", {
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
                {t("ee521d6bd908", "Start upload")}
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
                {t("53afa8ae2618", "Clear completed")}
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
