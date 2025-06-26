import { useCallback, useState, useEffect } from "react";
import { uploadFile } from "../utils/upload-api";
import { createFileWithPreview } from "../utils/file-processing";
import { useFileValidation } from "./use-file-validation";
import { useFilePreview } from "./use-file-preview";
import { useAnnouncement } from "@/hooks/use-announcement";
import { UPLOAD_MESSAGES } from "@/lib/utils/accessibility";
import {
  FileUploadState,
  UploadedFile,
  FileUploaderProps,
  FileValidationError,
} from "../types";

export function useFileUpload({
  acceptedFileTypes,
  maxFileSize,
  maxFiles = 1,
  onUploadComplete,
  enableImageCompression = false,
  imageCompressionQuality = 0.8,
  imageCompressionMaxWidth = 1920,
  imageCompressionMaxHeight = 1080,
}: Pick<
  FileUploaderProps,
  | "acceptedFileTypes"
  | "maxFileSize"
  | "maxFiles"
  | "onUploadComplete"
  | "enableImageCompression"
  | "imageCompressionQuality"
  | "imageCompressionMaxWidth"
  | "imageCompressionMaxHeight"
>) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { announce } = useAnnouncement();

  const { validateFiles } = useFileValidation({
    acceptedFileTypes,
    maxFileSize,
    maxFiles,
    currentFileCount: files.length,
  });

  const { generatePreview, revokePreview } = useFilePreview({
    enableImageCompression,
    imageCompressionQuality,
    imageCompressionMaxWidth,
    imageCompressionMaxHeight,
  });

  // Fixed: Handle files with better error reporting and don't stop on first error
  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setGlobalError(null);
      
      const { validFiles, errors, countError } = validateFiles(newFiles);

      // Handle count error
      if (countError) {
        setGlobalError(countError);
        announce(UPLOAD_MESSAGES.fileLimitExceeded(maxFiles), "assertive");
        return;
      }

      // Announce validation errors for invalid files
      if (errors.length > 0) {
        errors.forEach(({ file, error }: FileValidationError) => {
          announce(
            UPLOAD_MESSAGES.validationError(file.name, error),
            "assertive",
          );
        });
      }

      // Process only valid files
      if (validFiles.length === 0) {
        if (errors.length > 0) {
          setGlobalError(`All ${errors.length} file(s) failed validation`);
        }
        return;
      }

      const preparedFiles: FileUploadState[] = [];
      
      for (const file of validFiles) {
        try {
          const { file: processedFile, preview } = await generatePreview(file);
          const fileWithPreview = createFileWithPreview(processedFile, preview);

          preparedFiles.push({
            file: fileWithPreview,
            progress: 0,
            status: "pending",
            id: fileWithPreview._id!,
          });
        } catch (error) {
          console.error("Failed to process file:", file.name, error);
          announce(
            UPLOAD_MESSAGES.validationError(
              file.name,
              "Failed to process file for upload",
            ),
            "assertive",
          );
        }
      }

      if (preparedFiles.length > 0) {
        setFiles((prev) => [...prev, ...preparedFiles]);
        if (errors.length > 0) {
          announce(
            `${preparedFiles.length} of ${newFiles.length} files added successfully`,
            "polite",
          );
        }
      }
    },
    [validateFiles, generatePreview, announce, maxFiles],
  );

  // Upload file with progress tracking
  const uploadSingleFile = useCallback(
    async (fileState: FileUploadState): Promise<UploadedFile | null> => {
      const { id, file } = fileState;
      
      try {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "uploading" } : f)),
        );
        announce(UPLOAD_MESSAGES.uploadStart(file.name));

        let lastAnnouncedProgress = 0;
        const uploadedFile = await uploadFile(file, (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress } : f)),
          );
          
          if (progress >= lastAnnouncedProgress + 25 && progress < 100) {
            lastAnnouncedProgress = progress;
            announce(UPLOAD_MESSAGES.uploadProgress(file.name, progress));
          }
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "completed", uploadedFile, progress: 100 }
              : f,
          ),
        );
        
        return uploadedFile;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "error", error: errorMessage }
              : f,
          ),
        );
        return null;
      }
    },
    [announce],
  );

  // Auto-upload pending files
  useEffect(() => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length > 0) {
      Promise.all(pendingFiles.map(uploadSingleFile)).then((results) => {
        const successfulUploads = results.filter(
          (r): r is UploadedFile => r !== null,
        );
        if (onUploadComplete && successfulUploads.length > 0) {
          onUploadComplete(successfulUploads);
        }
      });
    }
  }, [files, uploadSingleFile, onUploadComplete]);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.file.preview) {
        revokePreview(fileToRemove.file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, [revokePreview]);

  return {
    files,
    globalError,
    handleFiles,
    removeFile,
    announce,
  };
}