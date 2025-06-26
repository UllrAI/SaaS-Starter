"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import {
  FileIcon,
  ImageIcon,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
} from "lucide-react";
import { getFileTypeIcon } from "./utils/file-processing";
import { FileWithPreview } from "./types";

const fileTypeIcons = {
  image: ImageIcon,
  video: FileVideo,
  audio: FileAudio,
  archive: FileArchive,
  text: FileText,
  file: FileIcon,
} as const;

interface FilePreviewProps {
  file: FileWithPreview;
  className?: string;
}

export const FilePreview = memo(
  ({ file, className = "h-12 w-12" }: FilePreviewProps) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setHasError(false);
    }, [file._id]);

    const handleImageError = useCallback(() => {
      setHasError(true);
    }, []);

    if (!file.preview || hasError) {
      const iconType = getFileTypeIcon(file.type);
      const IconComponent = fileTypeIcons[iconType];
      
      return (
        <div className={`text-muted-foreground flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 ${className}`}>
          <IconComponent className="h-8 w-8 text-gray-500" aria-hidden="true" />
        </div>
      );
    }

    return (
      <img
        src={file.preview}
        alt={file.name}
        className={`rounded object-contain ${className}`}
        onError={handleImageError}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.file._id === nextProps.file._id &&
      prevProps.file.preview === nextProps.file.preview &&
      prevProps.className === nextProps.className
    );
  },
);

FilePreview.displayName = "FilePreview";