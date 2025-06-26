import { UploadedFile } from "../types";

export interface PresignedUrlResponse {
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

// Get presigned URL for file upload
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  size: number,
): Promise<PresignedUrlResponse> {
  const response = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType,
      size,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  return response.json();
}

// Upload file using presigned URL with progress tracking
export function uploadFileWithProgress(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || "Server error"}`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed: Network error")),
    );

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

// Complete upload process
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadedFile> {
  const { presignedUrl, publicUrl, key } = await getPresignedUrl(
    file.name,
    file.type,
    file.size,
  );

  await uploadFileWithProgress(file, presignedUrl, onProgress);

  return {
    url: publicUrl,
    key,
    size: file.size,
    contentType: file.type,
    fileName: file.name,
  };
}