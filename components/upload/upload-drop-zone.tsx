"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/config/upload";
import {
  generateA11yId,
  createUploadInstructions,
  handleActivationKey,
  UPLOAD_MESSAGES,
} from "@/lib/utils/accessibility";

interface UploadDropZoneProps {
  acceptedFileTypes?: readonly string[];
  maxFileSize: number;
  maxFiles: number;
  disabled?: boolean;
  hasFiles: boolean;
  onFileSelect: (files: FileList) => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
  className?: string;
}

export function UploadDropZone({
  acceptedFileTypes,
  maxFileSize,
  maxFiles,
  disabled = false,
  hasFiles,
  onFileSelect,
  announce,
  className,
}: UploadDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadInstructionsId = useMemo(
    () => generateA11yId("upload-instructions"),
    [],
  );
  const dropZoneId = useMemo(() => generateA11yId("drop-zone"), []);

  const acceptAttribute = useMemo(
    () =>
      Array.isArray(acceptedFileTypes)
        ? acceptedFileTypes.join(",")
        : undefined,
    [acceptedFileTypes],
  );

  const uploadInstructions = useMemo(
    () =>
      createUploadInstructions({
        maxFiles,
        maxFileSize,
        acceptedFileTypes: acceptedFileTypes as string[],
      }),
    [maxFiles, maxFileSize, acceptedFileTypes],
  );

  const openFileDialog = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleDropZoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      handleActivationKey(e, () => {
        if (!disabled) openFileDialog();
      });
    },
    [disabled, openFileDialog],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDragOver) {
        setIsDragOver(true);
        announce(UPLOAD_MESSAGES.dragEnter);
      }
    },
    [isDragOver, announce],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      announce(UPLOAD_MESSAGES.dragLeave);
    },
    [announce],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || !e.dataTransfer.files) return;
      announce(UPLOAD_MESSAGES.filesSelected(e.dataTransfer.files.length));
      onFileSelect(e.dataTransfer.files);
    },
    [disabled, announce, onFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        announce(UPLOAD_MESSAGES.filesSelected(e.target.files.length));
        onFileSelect(e.target.files);
      }
      e.target.value = "";
    },
    [announce, onFileSelect],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptAttribute}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-describedby={uploadInstructionsId}
        aria-label={`File upload input. ${uploadInstructions}`}
      />
      
      <div id={uploadInstructionsId} className="sr-only">
        {uploadInstructions}
      </div>
      
      <div
        id={dropZoneId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`File drop zone. ${uploadInstructions} Press Enter or Space to select files.`}
        aria-describedby={uploadInstructionsId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={hasFiles ? undefined : openFileDialog}
        onKeyDown={hasFiles ? undefined : handleDropZoneKeyDown}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 transition-colors",
          "hover:border-primary/50 hover:bg-muted/50 focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none",
          isDragOver && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !hasFiles && "cursor-pointer flex min-h-[200px] items-center justify-center",
          className,
        )}
      >
        {!hasFiles ? (
          <div className="text-center">
            <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-muted-foreground text-sm">
              {maxFiles > 1 ? `Up to ${maxFiles} files, ` : ""}max{" "}
              {formatFileSize(maxFileSize)}.
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
              disabled={disabled}
              className="w-full"
              aria-label="Add more files for upload"
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Add More Files
            </Button>
          </div>
        )}
      </div>
    </>
  );
}