import { useCallback, useRef, useEffect } from "react";
import { processAndPreviewFile } from "../utils/file-processing";
import { ProcessedFileResult } from "../types";

export interface UseFilePreviewProps {
  enableImageCompression?: boolean;
  imageCompressionQuality?: number;
  imageCompressionMaxWidth?: number;
  imageCompressionMaxHeight?: number;
}

export function useFilePreview({
  enableImageCompression = false,
  imageCompressionQuality = 0.8,
  imageCompressionMaxWidth = 1920,
  imageCompressionMaxHeight = 1080,
}: UseFilePreviewProps = {}) {
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup object URLs on unmount
  useEffect(() => {
    const urlsToCleanup = objectUrlsRef.current;
    return () => {
      urlsToCleanup.forEach(URL.revokeObjectURL);
      urlsToCleanup.clear();
    };
  }, []);

  const generatePreview = useCallback(
    (file: File): Promise<ProcessedFileResult> => {
      return processAndPreviewFile(
        file,
        enableImageCompression,
        imageCompressionQuality,
        imageCompressionMaxWidth,
        imageCompressionMaxHeight,
      ).then((result) => {
        // Track object URLs for cleanup
        if (result.preview?.startsWith("blob:")) {
          objectUrlsRef.current.add(result.preview);
        }
        return result;
      });
    },
    [
      enableImageCompression,
      imageCompressionQuality,
      imageCompressionMaxWidth,
      imageCompressionMaxHeight,
    ],
  );

  const revokePreview = useCallback((preview: string) => {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
      objectUrlsRef.current.delete(preview);
    }
  }, []);

  return {
    generatePreview,
    revokePreview,
  };
}