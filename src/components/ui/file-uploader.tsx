// components/ui/file-uploader.tsx

"use client";

import React, {
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  Upload,
  X,
  FileIcon,
  ImageIcon,
  Loader2,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { Alert, AlertDescription } from "./alert";
import {
  UPLOAD_CONFIG,
  formatFileSize,
  isFileTypeAllowed,
  isFileSizeAllowed,
} from "@/lib/config/upload";

// --- Helper Functions and Components ---

const getFileTypeIcon = (contentType: string): React.ReactNode => {
  if (contentType.startsWith("image/"))
    return <ImageIcon className="h-8 w-8 text-gray-500" />;
  if (contentType.startsWith("video/"))
    return <FileVideo className="h-8 w-8 text-gray-500" />;
  if (contentType.startsWith("audio/"))
    return <FileAudio className="h-8 w-8 text-gray-500" />;
  if (
    contentType.startsWith("application/zip") ||
    contentType.includes("compressed")
  )
    return <FileArchive className="h-8 w-8 text-gray-500" />;
  if (contentType === "application/pdf" || contentType.startsWith("text/"))
    return <FileText className="h-8 w-8 text-gray-500" />;
  return <FileIcon className="h-8 w-8 text-gray-500" />;
};

const isAllowedUploadUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!UPLOAD_CONFIG.ALLOWED_UPLOAD_URL_PROTOCOLS.includes(parsedUrl.protocol))
      return false;

    if (UPLOAD_CONFIG.ALLOWED_UPLOAD_HOSTS.includes(hostname)) return true;

    return UPLOAD_CONFIG.ALLOWED_UPLOAD_HOST_SUFFIXES.some((suffix) =>
      hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
};

interface FileWithPreview extends File {
  preview?: string;
}

interface UploadedFile {
  url: string;
  key: string;
  size: number;
  contentType: string;
  fileName: string;
}

const FilePreview = ({ file }: { file: FileWithPreview }) => {
  const [hasError, setHasError] = useState(false);

  if (!file.preview || hasError) {
    return (
      <div className="text-muted-foreground flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
        {getFileTypeIcon(file.type)}
      </div>
    );
  }

  return (
    <img
      src={file.preview}
      alt={file.name}
      className="h-12 w-12 rounded object-contain"
      onError={() => setHasError(true)}
    />
  );
};

// --- Main Component ---

interface FileUploaderProps {
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

interface FileUploadState {
  file: FileWithPreview;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  uploadedFile?: UploadedFile;
}

export function FileUploader({
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
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.file.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(f.file.preview);
        }
      });
    };
  }, [files]);

  const validateFile = useCallback(
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
      // ** FIX: Restore the check for the global file size limit **
      if (!isFileSizeAllowed(file.size)) {
        return `File size exceeds the application's maximum limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`;
      }
      return null;
    },
    [acceptedFileTypes, maxFileSize],
  );

  const createPreview = useCallback(
    (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) return resolve(undefined);
        if (file.type === "image/svg+xml") {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(file);
        } else {
          resolve(URL.createObjectURL(file));
        }
      });
    },
    [],
  );

  const compressImage = useCallback(
    (file: File): Promise<File> => {
      return new Promise((resolve) => {
        if (
          !enableImageCompression ||
          !file.type.startsWith("image/") ||
          file.type === "image/svg+xml"
        )
          return resolve(file);
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > imageCompressionMaxWidth) {
            height = (height * imageCompressionMaxWidth) / width;
            width = imageCompressionMaxWidth;
          }
          if (height > imageCompressionMaxHeight) {
            width = (width * imageCompressionMaxHeight) / height;
            height = imageCompressionMaxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) =>
              resolve(
                blob
                  ? new File([blob], file.name, {
                      type: file.type,
                      lastModified: Date.now(),
                    })
                  : file,
              ),
            file.type,
            imageCompressionQuality,
          );
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
      });
    },
    [
      enableImageCompression,
      imageCompressionQuality,
      imageCompressionMaxWidth,
      imageCompressionMaxHeight,
    ],
  );

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setGlobalError(null);
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        setGlobalError(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      const preparedFiles: FileUploadState[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setGlobalError(error);
          return;
        }
        const processedFile = await compressImage(file);
        const preview = await createPreview(processedFile);
        const fileWithPreview: FileWithPreview = Object.assign(processedFile, {
          preview,
        });
        preparedFiles.push({
          file: fileWithPreview,
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...preparedFiles]);
    },
    [files.length, maxFiles, validateFile, compressImage, createPreview],
  );

  useEffect(() => {
    const uploadFile = async (fileIndex: number) => {
      const fileState = files[fileIndex];
      if (!fileState || fileState.status !== "pending") return null;

      try {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, status: "uploading" } : f,
          ),
        );

        const { file } = fileState;
        const response = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!response.ok)
          throw new Error(
            (await response.json()).error || "Failed to get upload URL",
          );

        const { presignedUrl, publicUrl, key } = await response.json();

        if (!presignedUrl || !isAllowedUploadUrl(presignedUrl)) {
          throw new Error("Unsafe upload URL received.");
        }

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok)
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);

        const uploadedFile: UploadedFile = {
          url: publicUrl,
          key,
          size: file.size,
          contentType: file.type,
          fileName: file.name,
        };

        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, status: "completed", uploadedFile } : f,
          ),
        );

        return uploadedFile;
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex
              ? { ...f, status: "error", error: (error as Error).message }
              : f,
          ),
        );
        return null;
      }
    };

    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter((f) => f.file.status === "pending");
    if (pendingFiles.length > 0) {
      Promise.all(pendingFiles.map((f) => uploadFile(f.index))).then(
        (results) => {
          const successfulUploads = results.filter(
            (r): r is UploadedFile => !!r,
          );
          if (onUploadComplete && successfulUploads.length > 0) {
            onUploadComplete(successfulUploads);
          }
        },
      );
    }
  }, [files, onUploadComplete]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [removedFile] = newFiles.splice(index, 1);
      if (removedFile?.file.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(removedFile.file.preview);
      }
      return newFiles;
    });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || !e.dataTransfer.files) return;
    handleFiles(e.dataTransfer.files);
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };
  const openFileDialog = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const acceptAttribute = useMemo(
    () =>
      Array.isArray(acceptedFileTypes)
        ? acceptedFileTypes.join(",")
        : undefined,
    [acceptedFileTypes],
  );

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptAttribute}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragOver && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          files.length === 0 &&
            "flex min-h-[200px] items-center justify-center",
        )}
      >
        {files.length === 0 ? (
          <div className="text-center">
            <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-muted-foreground text-sm">
              {maxFiles > 1 ? `Up to ${maxFiles} files, ` : ""}
              max {formatFileSize(maxFileSize)}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((fileState, index) => (
              <div
                key={index}
                className="bg-background flex items-center space-x-4 rounded-lg border p-4"
              >
                <FilePreview
                  key={`${fileState.file.name}-${fileState.file.size}-${fileState.file.lastModified}`}
                  file={fileState.file}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {fileState.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(fileState.file.size)} •{" "}
                    {fileState.file.type}
                  </p>
                  {fileState.status === "uploading" && (
                    <div className="mt-2">
                      <Progress value={fileState.progress} className="h-2" />
                    </div>
                  )}
                  <div className="mt-1 flex items-center space-x-2">
                    {fileState.status === "uploading" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-muted-foreground text-xs">
                          Uploading...
                        </span>
                      </>
                    )}
                    {fileState.status === "completed" && (
                      <span className="text-xs text-green-600">✓ Uploaded</span>
                    )}
                    {fileState.status === "error" && (
                      <span className="text-xs text-red-600">
                        ✗ {fileState.error}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={fileState.status === "uploading"}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {files.length < maxFiles && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Add {files.length > 0 ? "More " : ""}Files
              </Button>
            )}
          </div>
        )}
      </div>
      {globalError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
