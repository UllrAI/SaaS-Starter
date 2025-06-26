"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAnnouncement } from "@/hooks/use-announcement";
import { UPLOAD_CONFIG } from "@/lib/config/upload";
import { useFileUpload } from "./hooks/use-file-upload";
import { FileItem } from "./file-item";
import { UploadDropZone } from "./upload-drop-zone";
import { FileUploaderProps } from "./types";

function FileUploaderComponent({
  acceptedFileTypes = UPLOAD_CONFIG.ALLOWED_FILE_TYPES,
  maxFileSize = UPLOAD_CONFIG.MAX_FILE_SIZE,
  maxFiles = 1,
  onUploadComplete,
  className,
  disabled = false,
  enableImageCompression = false,
  imageCompressionQuality = 0.8,
  imageCompressionMaxWidth = 1920,
  imageCompressionMaxHeight = 1080,
}: FileUploaderProps) {
  const { announcementRef } = useAnnouncement();
  
  const {
    files,
    globalError,
    handleFiles,
    removeFile,
    announce,
  } = useFileUpload({
    acceptedFileTypes,
    maxFileSize,
    maxFiles,
    onUploadComplete,
    enableImageCompression,
    imageCompressionQuality,
    imageCompressionMaxWidth,
    imageCompressionMaxHeight,
  });

  const hasFiles = files.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Drop zone */}
      <UploadDropZone
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        maxFiles={maxFiles}
        disabled={disabled}
        hasFiles={hasFiles}
        onFileSelect={handleFiles}
        announce={announce}
        className={hasFiles ? "min-h-0 p-4" : undefined}
      />

      {/* File list */}
      {hasFiles && (
        <div className="mt-4 space-y-4" role="list" aria-label="Selected files">
          {files.map((fileState) => (
            <FileItem
              key={fileState.id}
              fileState={fileState}
              onRemove={removeFile}
              announce={announce}
            />
          ))}
        </div>
      )}

      {/* Global error display */}
      {globalError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export const FileUploader = memo(FileUploaderComponent);
FileUploader.displayName = "FileUploader";