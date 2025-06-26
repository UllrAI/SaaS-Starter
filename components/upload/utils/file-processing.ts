import { FileWithPreview, ProcessedFileResult } from "../types";

// Generate file ID using modern API (fixes substr() deprecation)
export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Get file type icon based on content type
export function getFileTypeIcon(contentType: string) {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (
    contentType.startsWith("application/zip") ||
    contentType.includes("compressed")
  ) return "archive";
  if (contentType === "application/pdf" || contentType.startsWith("text/"))
    return "text";
  return "file";
}

// Process file and generate preview
export function processAndPreviewFile(
  file: File,
  enableImageCompression = false,
  imageCompressionQuality = 0.8,
  imageCompressionMaxWidth = 1920,
  imageCompressionMaxHeight = 1080,
): Promise<ProcessedFileResult> {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith("image/");
    const isCompressible =
      isImage && enableImageCompression && file.type !== "image/svg+xml";

    // Case 1: Compressible image
    if (isCompressible) {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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
        
        if (!ctx) {
          resolve({ file });
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        const preview = canvas.toDataURL(file.type, imageCompressionQuality);

        canvas.toBlob(
          (blob) => {
            const compressedFile = blob
              ? new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                })
              : file;
            resolve({ file: compressedFile, preview });
          },
          file.type,
          imageCompressionQuality,
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ file });
      };
      
      img.src = objectUrl;
      return;
    }

    // Case 2: Non-compressible image or other file types
    if (isImage) {
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ file, preview: reader.result as string });
        };
        reader.onerror = () => resolve({ file });
        reader.readAsDataURL(file);
      } else {
        const objectUrl = URL.createObjectURL(file);
        resolve({ file, preview: objectUrl });
      }
    } else {
      resolve({ file });
    }
  });
}

// Create file with preview and ID
export function createFileWithPreview(
  processedFile: File,
  preview?: string,
): FileWithPreview {
  const fileId = generateFileId();
  return Object.assign(processedFile, {
    preview,
    _id: fileId,
  });
}