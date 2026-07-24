"use client";

import { normalizeContentType, UPLOAD_CONFIG } from "@/lib/config/upload";
import {
  FileUploadIssueError,
  type UploadTransport,
  type UploadedFile,
} from "./types";

interface PresignedUploadPayload {
  intentId?: string;
  presignedUrl: string;
  publicUrl: string;
  key: string;
  protocolVersion: 2;
  requiredHeaders: Record<string, string>;
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
  requiredHeaders,
}: {
  presignedUrl: string;
  file: File;
  onProgress: (progress: number) => void;
  signal: AbortSignal;
  requiredHeaders: Record<string, string>;
}): Promise<void> {
  let xhr: XMLHttpRequest | null = null;

  return new Promise<void>((resolve, reject) => {
    xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    Object.entries(requiredHeaders).forEach(([name, value]) => {
      xhr?.setRequestHeader(name, value);
    });

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
        const contentType = normalizeContentType(file.type);
        const presignedResponse = await fetch(presignedUrlEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            protocolVersion: 2,
            fileName: file.name,
            contentType,
            size: file.size,
          }),
          signal: abortController.signal,
        });

        if (!presignedResponse.ok) {
          const error = await parseJsonSafely(presignedResponse);
          if (error?.code === "UPLOAD_QUOTA_EXCEEDED") {
            throw new FileUploadIssueError({
              code: "upload-quota-exceeded",
              fileName: file.name,
            });
          }
          throw createRequestFailure();
        }

        const {
          intentId,
          key,
          presignedUrl,
          protocolVersion,
          publicUrl,
          requiredHeaders,
        } = (await presignedResponse.json()) as PresignedUploadPayload;

        if (
          protocolVersion !== 2 ||
          requiredHeaders?.["If-None-Match"] !== "*" ||
          requiredHeaders?.["Content-Type"] !== contentType ||
          !presignedUrl ||
          !isAllowedUploadUrl(presignedUrl)
        ) {
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
          requiredHeaders,
        });

        const completeResponse = await fetch(completeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intentId,
            fileName: file.name,
            contentType,
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
