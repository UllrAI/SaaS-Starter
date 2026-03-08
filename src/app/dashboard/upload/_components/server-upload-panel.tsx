"use client";

import { useId, useRef, useState } from "react";
import { Server, Sparkles, ShieldCheck, Workflow } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/components/ui/file-uploader";

interface ServerUploadResult {
  contentType?: string;
  error?: string;
  fileName: string;
  key?: string;
  size?: number;
  success: boolean;
  url?: string;
}

interface ServerUploadResponse {
  results: ServerUploadResult[];
  summary: {
    failed: number;
    success: number;
    total: number;
  };
}

function ServerUploadSuccessToast({ count }: { count: number }) {
  return count === 1 ? (
    <>1 file finished through the server pipeline.</>
  ) : (
    <>{count} files finished through the server pipeline.</>
  );
}

function ServerUploadWarningToast({
  failed,
  success,
}: {
  failed: number;
  success: number;
}) {
  return (
    <>
      {success} file(s) uploaded and {failed} file(s) need attention.
    </>
  );
}

function ServerUploadFailureToast() {
  return <>The server upload did not complete.</>;
}

export function ServerUploadPanel() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setProgress(8);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      setProgress(24);

      const response = await fetch("/api/upload/server-upload", {
        method: "POST",
        body: formData,
      });

      setProgress(76);

      if (!response.ok) {
        throw new Error("server-upload-failed");
      }

      const payload = (await response.json()) as ServerUploadResponse;
      setProgress(100);

      const uploadedFiles = payload.results
        .filter(
          (
            result,
          ): result is Required<ServerUploadResult> & { success: true } =>
            Boolean(
              result.success &&
              result.url &&
              result.key &&
              result.size !== undefined &&
              result.contentType,
            ),
        )
        .map((result) => ({
          contentType: result.contentType,
          fileName: result.fileName,
          key: result.key,
          size: result.size,
          url: result.url,
        }));

      if (uploadedFiles.length > 0) {
        setUploadedFiles((currentFiles) => {
          const merged = new Map<string, UploadedFile>();

          [...uploadedFiles, ...currentFiles].forEach((file) => {
            merged.set(file.key, file);
          });

          return Array.from(merged.values());
        });
      }

      if (payload.summary.failed > 0) {
        toast.warning(
          <ServerUploadWarningToast
            failed={payload.summary.failed}
            success={payload.summary.success}
          />,
        );
      } else {
        toast.success(
          <ServerUploadSuccessToast count={payload.summary.success} />,
        );
      }
    } catch (error) {
      console.error("Server upload failed", error);
      toast.error(<ServerUploadFailureToast />);
    } finally {
      setTimeout(() => {
        setProgress(0);
        setIsUploading(false);
      }, 250);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server className="h-4 w-4" />
            <span>Upload through the server</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Use this path when the backend needs to validate or transform files
            before storage.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Streaming upload</Badge>
          <Badge variant="secondary">Auth checked</Badge>
          <Badge variant="outline">Parallel processing</Badge>
        </div>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        disabled={isUploading}
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "group w-full rounded-xl border border-dashed p-4 text-left transition",
          "hover:border-primary/40 hover:bg-primary/5",
          isUploading && "cursor-not-allowed opacity-70",
        )}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isUploading ? (
                <>Uploading through the server…</>
              ) : (
                <>Select files for server processing</>
              )}
            </p>
            <p className="text-muted-foreground text-sm">
              The request stays inside your application boundary before landing
              in storage.
            </p>
          </div>

          <span className="text-muted-foreground group-hover:text-foreground text-sm transition">
            {isUploading ? <>Working…</> : <>Browse files</>}
          </span>
        </div>
      </button>

      {isUploading ? (
        <div className="bg-background space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span>Pipeline progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : null}

      <div className="text-muted-foreground bg-muted/30 rounded-lg border p-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Validation
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enrichment
          </span>
          <span className="inline-flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Parallel processing
          </span>
        </div>
      </div>

      {uploadedFiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {uploadedFiles.map((file) => (
            <a
              key={file.key}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="group bg-muted relative aspect-square overflow-hidden rounded-xl border"
            >
              {file.contentType.startsWith("image/") ? (
                <Image
                  src={file.url}
                  alt={file.fileName}
                  fill
                  className="object-cover transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <Server className="h-6 w-6" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent p-3 text-white">
                <p className="truncate text-xs font-medium">{file.fileName}</p>
                <p className="text-[11px] text-white/80">Uploaded</p>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
