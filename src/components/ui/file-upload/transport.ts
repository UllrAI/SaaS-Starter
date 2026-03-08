"use client";

import { UPLOAD_CONFIG } from "@/lib/config/upload";
import {
  FileUploadIssueError,
  type UploadTransport,
  type UploadedFile,
} from "./types";

interface PresignedUploadPayload {
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

interface CreatePresignedUploadTransportOptions {
  presignedUrlEndpoint?: string;
  completeEndpoint?: string;
}

function isAllowedUploadUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (
      !UPLOAD_CONFIG.ALLOWED_UPLOAD_URL_PROTOCOLS.includes(parsedUrl.protocol)
    ) {
      return false;
    }

    if (UPLOAD_CONFIG.ALLOWED_UPLOAD_HOSTS.includes(hostname)) {
      return true;
    }

    return UPLOAD_CONFIG.ALLOWED_UPLOAD_HOST_SUFFIXES.some((suffix) =>
      hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

async function parseJsonSafely(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function createRequestFailure() {
  return new FileUploadIssueError({
    code: "request-failed",
  });
}

function uploadToPresignedUrl({
  presignedUrl,
  file,
  onProgress,
  signal,
}: {
  presignedUrl: string;
  file: File;
  onProgress: (progress: number) => void;
  signal: AbortSignal;
}): Promise<void> {
  let xhr: XMLHttpRequest | null = null;

  return new Promise<void>((resolve, reject) => {
    xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    const abortUpload = () => {
      xhr?.abort();
    };

    signal.addEventListener("abort", abortUpload, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => {
      reject(
        new FileUploadIssueError({
          code: "network-error",
          fileName: file.name,
        }),
      );
    };

    xhr.onabort = () => {
      reject(
        new FileUploadIssueError({
          code: "upload-aborted",
          fileName: file.name,
        }),
      );
    };

    xhr.onload = () => {
      if (xhr && xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(
        new FileUploadIssueError({
          code: "upload-failed",
          fileName: file.name,
        }),
      );
    };

    xhr.send(file);
  });
}

export function createPresignedUploadTransport(
  options: CreatePresignedUploadTransportOptions = {},
): UploadTransport {
  const presignedUrlEndpoint =
    options.presignedUrlEndpoint ?? "/api/upload/presigned-url";
  const completeEndpoint = options.completeEndpoint ?? "/api/upload/complete";

  return {
    startUpload({ file, onProgress }) {
      const abortController = new AbortController();

      const promise = (async () => {
        const presignedResponse = await fetch(presignedUrlEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          }),
          signal: abortController.signal,
        });

        if (!presignedResponse.ok) {
          await parseJsonSafely(presignedResponse);
          throw createRequestFailure();
        }

        const { key, presignedUrl, publicUrl } =
          (await presignedResponse.json()) as PresignedUploadPayload;

        if (!presignedUrl || !isAllowedUploadUrl(presignedUrl)) {
          throw new FileUploadIssueError({
            code: "unsafe-upload-url",
            fileName: file.name,
          });
        }

        await uploadToPresignedUrl({
          presignedUrl,
          file,
          onProgress,
          signal: abortController.signal,
        });

        const completeResponse = await fetch(completeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
            key,
            url: publicUrl,
          }),
          signal: abortController.signal,
        });

        const completeData = await parseJsonSafely(completeResponse);

        if (!completeResponse.ok || !completeData?.file) {
          throw createRequestFailure();
        }

        return completeData.file as UploadedFile;
      })().catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new FileUploadIssueError({
            code: "upload-aborted",
            fileName: file.name,
          });
        }

        throw error;
      });

      return {
        promise,
        cancel: () => {
          abortController.abort();
        },
      };
    },
  };
}
