"use client";

import React, { useCallback, useEffect, useMemo, memo } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/config/upload";
import {
  generateA11yId,
  handleActivationKey,
  UPLOAD_MESSAGES,
} from "@/lib/utils/accessibility";
import { FilePreview } from "./file-preview";
import { FileUploadState } from "./types";

interface FileItemProps {
  fileState: FileUploadState;
  onRemove: (fileId: string) => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

export const FileItem = memo(
  ({ fileState, onRemove, announce }: FileItemProps) => {
    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        announce(UPLOAD_MESSAGES.fileRemoved(fileState.file.name));
        onRemove(fileState.id);
      },
      [fileState.id, fileState.file.name, onRemove, announce],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        handleActivationKey(e, () => {
          announce(UPLOAD_MESSAGES.fileRemoved(fileState.file.name));
          onRemove(fileState.id);
        });
      },
      [fileState.id, fileState.file.name, onRemove, announce],
    );

    useEffect(() => {
      if (fileState.status === "completed") {
        announce(UPLOAD_MESSAGES.uploadSuccess(fileState.file.name));
      } else if (fileState.status === "error" && fileState.error) {
        announce(
          UPLOAD_MESSAGES.uploadError(fileState.file.name, fileState.error),
          "assertive",
        );
      }
    }, [fileState.status, fileState.file.name, fileState.error, announce]);

    const progressId = useMemo(() => generateA11yId("progress"), []);
    const statusId = useMemo(() => generateA11yId("status"), []);

    return (
      <div
        className="bg-background flex items-center space-x-4 rounded-lg border p-4"
        role="listitem"
        aria-describedby={`${progressId} ${statusId}`}
      >
        <FilePreview file={fileState.file} />
        
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-medium"
            aria-label={`File: ${fileState.file.name}`}
          >
            {fileState.file.name}
          </p>
          <p
            className="text-muted-foreground text-xs"
            aria-label={`Size: ${formatFileSize(fileState.file.size)}, Type: ${fileState.file.type}`}
          >
            {formatFileSize(fileState.file.size)} • {fileState.file.type}
          </p>
          
          {fileState.status === "uploading" && (
            <div className="mt-2">
              <Progress
                value={fileState.progress}
                className="h-2"
                aria-labelledby={progressId}
              />
              <div id={progressId} className="sr-only">
                Upload progress: {fileState.progress}%
              </div>
            </div>
          )}
          
          <div className="mt-1 flex items-center space-x-2" id={statusId}>
            {fileState.status === "uploading" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span
                  className="text-muted-foreground text-xs"
                  aria-live="polite"
                >
                  Uploading... {fileState.progress}%
                </span>
              </>
            )}
            {fileState.status === "completed" && (
              <span
                className="text-xs text-green-600"
                role="status"
                aria-live="polite"
              >
                ✓ Uploaded successfully
              </span>
            )}
            {fileState.status === "error" && (
              <span
                className="text-xs text-red-600"
                role="alert"
                aria-live="assertive"
              >
                ✗ {fileState.error}
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          onKeyDown={handleKeyDown}
          disabled={fileState.status === "uploading"}
          className="flex-shrink-0"
          aria-label={`Remove ${fileState.file.name}`}
          title={`Remove ${fileState.file.name}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  );

FileItem.displayName = "FileItem";