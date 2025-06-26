import { useCallback } from "react";
import {
  UPLOAD_CONFIG,
  formatFileSize,
  isFileTypeAllowed,
  isFileSizeAllowed,
} from "@/lib/config/upload";
import { FileValidationError } from "../types";

export interface UseFileValidationProps {
  acceptedFileTypes?: readonly string[];
  maxFileSize?: number;
  maxFiles?: number;
  currentFileCount?: number;
}

export function useFileValidation({
  acceptedFileTypes = UPLOAD_CONFIG.ALLOWED_FILE_TYPES,
  maxFileSize = UPLOAD_CONFIG.MAX_FILE_SIZE,
  maxFiles = 1,
  currentFileCount = 0,
}: UseFileValidationProps) {
  const validateSingleFile = useCallback(
    (file: File): string | null => {
      if (acceptedFileTypes && !acceptedFileTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed.`;
      }
      if (!isFileTypeAllowed(file.type)) {
        return `File type ${file.type} is not supported.`;
      }
      if (file.size > maxFileSize) {
        return `File size ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(maxFileSize)}.`;
      }
      if (!isFileSizeAllowed(file.size)) {
        return `File size exceeds the application's maximum limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`;
      }
      return null;
    },
    [acceptedFileTypes, maxFileSize],
  );

  const validateFileCount = useCallback(
    (newFileCount: number): string | null => {
      if (currentFileCount + newFileCount > maxFiles) {
        return `Maximum ${maxFiles} file(s) allowed`;
      }
      return null;
    },
    [currentFileCount, maxFiles],
  );

  // Fixed: Process all files and collect validation results instead of stopping on first error
  const validateFiles = useCallback(
    (files: FileList | File[]): {
      validFiles: File[];
      errors: FileValidationError[];
      countError?: string;
    } => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: FileValidationError[] = [];

      // Check file count limit first
      const countError = validateFileCount(fileArray.length);
      if (countError) {
        return { validFiles: [], errors: [], countError };
      }

      // Validate each file individually and collect results
      for (const file of fileArray) {
        const error = validateSingleFile(file);
        if (error) {
          errors.push({ file, error });
        } else {
          validFiles.push(file);
        }
      }

      return { validFiles, errors };
    },
    [validateSingleFile, validateFileCount],
  );

  return {
    validateSingleFile,
    validateFileCount,
    validateFiles,
  };
}