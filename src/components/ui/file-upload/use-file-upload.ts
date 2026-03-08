"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type RefObject,
} from "react";
import {
  UPLOAD_CONFIG,
  isFileSizeAllowed,
  isFileTypeAllowed,
} from "@/lib/config/upload";
import { createPresignedUploadTransport } from "./transport";
import {
  FileUploadIssueError,
  type FileUploadItem,
  type FileUploadIssue,
  type UploadTask,
  type UploadTransport,
  type UploadedFile,
} from "./types";

type InputProps = ComponentPropsWithoutRef<"input">;
type RootProps = ComponentPropsWithoutRef<"div">;

export interface UseFileUploadOptions {
  acceptedFileTypes?: readonly string[];
  autoUpload?: boolean;
  disabled?: boolean;
  enableImageCompression?: boolean;
  imageCompressionQuality?: number;
  imageCompressionMaxHeight?: number;
  imageCompressionMaxWidth?: number;
  maxFileSize?: number;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  transport?: UploadTransport;
}

export interface UseFileUploadResult {
  accept: string | undefined;
  addFiles: (files: FileList | File[]) => Promise<void>;
  autoUpload: boolean;
  canAddMore: boolean;
  cancelFile: (id: string) => void;
  clearCompleted: () => void;
  getInputProps: (props?: InputProps) => InputProps;
  getRootProps: (props?: RootProps) => RootProps;
  inputRef: RefObject<HTMLInputElement | null>;
  isDragActive: boolean;
  isUploading: boolean;
  issue: FileUploadIssue | null;
  items: FileUploadItem[];
  openFileDialog: () => void;
  removeFile: (id: string) => void;
  retryFile: (id: string) => Promise<void>;
  uploadAll: () => Promise<void>;
}

function composeEventHandlers<EventType>(
  theirHandler: ((event: EventType) => void) | undefined,
  ourHandler: (event: EventType) => void,
) {
  return (event: EventType) => {
    theirHandler?.(event);

    const syntheticEvent = event as { defaultPrevented?: boolean };
    if (!syntheticEvent.defaultPrevented) {
      ourHandler(event);
    }
  };
}

function createPreviewUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    return undefined;
  }

  return URL.createObjectURL(file);
}

function revokePreviewUrl(previewUrl?: string) {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}

async function compressImage({
  enabled,
  file,
  quality,
  maxWidth,
  maxHeight,
}: {
  enabled: boolean;
  file: File;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}) {
  if (
    !enabled ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("image-load-failed"));
      element.src = sourceUrl;
    });

    let width = image.width;
    let height = image.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type, quality);
    });

    if (!blob) {
      return file;
    }

    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function resolveUploadIssue(
  error: unknown,
  fallback: FileUploadIssue,
): FileUploadIssue {
  if (error instanceof FileUploadIssueError) {
    return error.issue;
  }

  return fallback;
}

export function useFileUpload({
  acceptedFileTypes = UPLOAD_CONFIG.ALLOWED_FILE_TYPES,
  autoUpload = true,
  disabled = false,
  enableImageCompression = false,
  imageCompressionQuality = 0.8,
  imageCompressionMaxHeight = 1080,
  imageCompressionMaxWidth = 1920,
  maxFileSize = UPLOAD_CONFIG.MAX_FILE_SIZE,
  maxFiles = 1,
  onUploadComplete,
  transport,
}: UseFileUploadOptions = {}): UseFileUploadResult {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [issue, setIssue] = useState<FileUploadIssue | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeTasksRef = useRef(new Map<string, UploadTask>());
  const nextIdRef = useRef(0);
  const itemsRef = useRef(items);
  const resolvedTransport = useMemo(
    () => transport ?? createPresignedUploadTransport(),
    [transport],
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const cleanupUploads = useCallback(() => {
    activeTasksRef.current.forEach((task) => task.cancel?.());
    itemsRef.current.forEach((item) => revokePreviewUrl(item.previewUrl));
  }, []);

  useEffect(() => cleanupUploads, [cleanupUploads]);

  const updateItem = useCallback(
    (id: string, updater: (item: FileUploadItem) => FileUploadItem) => {
      setItems((currentItems) => {
        const nextItems = currentItems.map((item) =>
          item.id === id ? updater(item) : item,
        );
        itemsRef.current = nextItems;
        return nextItems;
      });
    },
    [],
  );

  const uploadByIds = useCallback(
    async (ids?: string[]) => {
      const candidates = itemsRef.current.filter((item) => {
        if (ids && !ids.includes(item.id)) {
          return false;
        }

        return (
          item.status === "queued" ||
          item.status === "error" ||
          item.status === "canceled"
        );
      });

      if (candidates.length === 0) {
        return;
      }

      const results = await Promise.all(
        candidates.map(async (candidate) => {
          updateItem(candidate.id, (item) => ({
            ...item,
            issue: undefined,
            progress: 0,
            status: "uploading",
          }));

          const task = resolvedTransport.startUpload({
            file: candidate.file,
            onProgress: (progress) => {
              updateItem(candidate.id, (item) =>
                item.status === "uploading" ? { ...item, progress } : item,
              );
            },
          });

          activeTasksRef.current.set(candidate.id, task);

          try {
            const uploadedFile = await task.promise;

            updateItem(candidate.id, (item) => ({
              ...item,
              progress: 100,
              status: "success",
              uploadedFile,
            }));

            return uploadedFile;
          } catch (error) {
            const nextIssue = resolveUploadIssue(error, {
              code: "upload-failed",
              fileName: candidate.file.name,
            });

            updateItem(candidate.id, (item) => ({
              ...item,
              issue: nextIssue,
              progress: nextIssue.code === "upload-aborted" ? 0 : item.progress,
              status:
                nextIssue.code === "upload-aborted" ? "canceled" : "error",
            }));

            return null;
          } finally {
            activeTasksRef.current.delete(candidate.id);
          }
        }),
      );

      const uploadedFiles = results.filter((result): result is UploadedFile =>
        Boolean(result),
      );

      if (uploadedFiles.length > 0) {
        onUploadComplete?.(uploadedFiles);
      }
    },
    [onUploadComplete, resolvedTransport, updateItem],
  );

  const validateFile = useCallback(
    (file: File): FileUploadIssue | null => {
      if (
        acceptedFileTypes.length > 0 &&
        !acceptedFileTypes.includes(file.type)
      ) {
        return {
          code: "file-type-not-accepted",
          contentType: file.type,
          fileName: file.name,
        };
      }

      if (!isFileTypeAllowed(file.type)) {
        return {
          code: "file-type-not-supported",
          contentType: file.type,
          fileName: file.name,
        };
      }

      if (file.size > maxFileSize) {
        return {
          code: "file-too-large",
          fileName: file.name,
          fileSize: file.size,
          maxFileSize,
        };
      }

      if (!isFileSizeAllowed(file.size)) {
        return {
          code: "file-too-large-for-app",
          fileName: file.name,
          fileSize: file.size,
          maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        };
      }

      return null;
    },
    [acceptedFileTypes, maxFileSize],
  );

  const addFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      if (disabled) {
        return;
      }

      setIssue(null);

      const fileList = Array.from(selectedFiles);
      if (fileList.length === 0) {
        return;
      }

      if (itemsRef.current.length + fileList.length > maxFiles) {
        setIssue({
          code: "too-many-files",
          maxFiles,
        });
        return;
      }

      const firstValidationIssue = fileList
        .map((file) => validateFile(file))
        .find((value): value is FileUploadIssue => Boolean(value));

      if (firstValidationIssue) {
        setIssue(firstValidationIssue);
        return;
      }

      try {
        const preparedItems = await Promise.all(
          fileList.map(async (file) => {
            const processedFile = await compressImage({
              enabled: enableImageCompression,
              file,
              quality: imageCompressionQuality,
              maxHeight: imageCompressionMaxHeight,
              maxWidth: imageCompressionMaxWidth,
            });

            return {
              file: processedFile,
              id: `upload-${nextIdRef.current++}`,
              previewUrl: createPreviewUrl(processedFile),
              progress: 0,
              status: "queued",
            } satisfies FileUploadItem;
          }),
        );

        const nextItems = [...itemsRef.current, ...preparedItems];
        itemsRef.current = nextItems;
        setItems(nextItems);

        if (autoUpload) {
          void uploadByIds(preparedItems.map((item) => item.id));
        }
      } catch {
        setIssue({
          code: "upload-preparation-failed",
        });
      }
    },
    [
      autoUpload,
      disabled,
      enableImageCompression,
      imageCompressionMaxHeight,
      imageCompressionMaxWidth,
      imageCompressionQuality,
      maxFiles,
      uploadByIds,
      validateFile,
    ],
  );

  const cancelFile = useCallback((id: string) => {
    activeTasksRef.current.get(id)?.cancel?.();
  }, []);

  const removeFile = useCallback((id: string) => {
    activeTasksRef.current.get(id)?.cancel?.();

    setItems((currentItems) => {
      const itemToRemove = currentItems.find((item) => item.id === id);
      revokePreviewUrl(itemToRemove?.previewUrl);
      const nextItems = currentItems.filter((item) => item.id !== id);
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const retryFile = useCallback(
    async (id: string) => {
      updateItem(id, (item) => ({
        ...item,
        issue: undefined,
        progress: 0,
        status: "queued",
      }));

      await uploadByIds([id]);
    },
    [updateItem, uploadByIds],
  );

  const clearCompleted = useCallback(() => {
    setItems((currentItems) => {
      currentItems.forEach((item) => {
        if (item.status === "success") {
          revokePreviewUrl(item.previewUrl);
        }
      });

      const nextItems = currentItems.filter(
        (item) => item.status !== "success",
      );
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const accept = useMemo(
    () =>
      acceptedFileTypes.length > 0 ? acceptedFileTypes.join(",") : undefined,
    [acceptedFileTypes],
  );

  const getInputProps = useCallback(
    (props: InputProps = {}) => ({
      ...props,
      accept,
      disabled,
      multiple: maxFiles > 1,
      onChange: composeEventHandlers(props.onChange, (event) => {
        if (event.target.files) {
          void addFiles(event.target.files);
        }

        event.target.value = "";
      }),
      ref: inputRef,
      type: "file" as const,
    }),
    [accept, addFiles, disabled, maxFiles],
  );

  const getRootProps = useCallback(
    (props: RootProps = {}) => ({
      ...props,
      onClick: composeEventHandlers(props.onClick, () => {
        openFileDialog();
      }),
      onDragLeave: composeEventHandlers(props.onDragLeave, (event) => {
        event.preventDefault();
        setIsDragActive(false);
      }),
      onDragOver: composeEventHandlers(props.onDragOver, (event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragActive(true);
        }
      }),
      onDrop: composeEventHandlers(props.onDrop, (event) => {
        event.preventDefault();
        setIsDragActive(false);

        if (!disabled && event.dataTransfer.files) {
          void addFiles(event.dataTransfer.files);
        }
      }),
      onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFileDialog();
        }
      }),
      role: props.role ?? "button",
      tabIndex: props.tabIndex ?? (disabled ? -1 : 0),
    }),
    [addFiles, disabled, openFileDialog],
  );

  return {
    accept,
    addFiles,
    autoUpload,
    canAddMore: items.length < maxFiles,
    cancelFile,
    clearCompleted,
    getInputProps,
    getRootProps,
    inputRef,
    isDragActive,
    isUploading: items.some((item) => item.status === "uploading"),
    issue,
    items,
    openFileDialog,
    removeFile,
    retryFile,
    uploadAll: () => uploadByIds(),
  };
}
