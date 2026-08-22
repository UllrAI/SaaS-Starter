"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Film,
  ImageIcon,
  PanelRightClose,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/translation/client";
import { cn } from "@/lib/utils";
import type { CanvasArtifact } from "./artifacts";

interface CanvasPanelProps {
  artifacts: CanvasArtifact[];
  activeArtifactId?: string;
  onSelectArtifact: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

function ArtifactIcon({ kind }: { kind: CanvasArtifact["kind"] }) {
  if (kind === "image") return <ImageIcon className="size-4" />;
  if (kind === "video") return <Film className="size-4" />;
  return <FileText className="size-4" />;
}

function safeFilename(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .slice(0, 80);
}

function getMediaExtension(
  artifact: Extract<CanvasArtifact, { kind: "image" | "video" }>,
) {
  const byMediaType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  if (artifact.mediaType && byMediaType[artifact.mediaType]) {
    return byMediaType[artifact.mediaType];
  }

  try {
    const extension = new URL(artifact.url, window.location.origin).pathname
      .split(".")
      .at(-1)
      ?.toLowerCase();
    if (extension && /^(?:gif|jpe?g|mov|mp4|png|webm|webp)$/.test(extension)) {
      return extension === "jpeg" ? "jpg" : extension;
    }
  } catch {
    // Fall through to a safe extension for data and opaque URLs.
  }

  return artifact.kind === "image" ? "png" : "mp4";
}

function downloadArtifact(artifact: CanvasArtifact, fallbackTitle: string) {
  const anchor = document.createElement("a");
  const title = safeFilename(artifact.title ?? fallbackTitle) || "artifact";
  let objectUrl: string | undefined;

  if (artifact.kind === "markdown") {
    objectUrl = URL.createObjectURL(
      new Blob([artifact.content], { type: "text/markdown;charset=utf-8" }),
    );
    anchor.href = objectUrl;
    anchor.download = `${title}.md`;
  } else {
    anchor.href = artifact.url;
    anchor.download = `${title}.${getMediaExtension(artifact)}`;
    anchor.rel = "noreferrer";
  }

  anchor.click();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}

export function CanvasPanel({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onClose,
  className,
}: CanvasPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const activeArtifact =
    artifacts.find((artifact) => artifact.id === activeArtifactId) ??
    artifacts.at(-1);
  const fallbackTitle = activeArtifact
    ? t(`ai_canvas_untitled_${activeArtifact.kind}`)
    : t("ai_canvas_title");

  const handleCopy = async () => {
    if (!activeArtifact) return;
    const value =
      activeArtifact.kind === "markdown"
        ? activeArtifact.content
        : activeArtifact.url;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section
      aria-label={t("ai_canvas_title")}
      className={cn("bg-muted/20 min-h-0 flex-col", className)}
    >
      <header className="bg-background flex h-12 shrink-0 items-center gap-2 border-b px-3 pr-12 lg:pr-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          {activeArtifact ? (
            <ArtifactIcon kind={activeArtifact.kind} />
          ) : (
            <PanelRightClose className="size-4" />
          )}
          <span>{t("ai_canvas_title")}</span>
        </div>

        {artifacts.length > 0 && (
          <Select value={activeArtifact?.id} onValueChange={onSelectArtifact}>
            <SelectTrigger
              size="sm"
              className="ml-auto max-w-56 border-0 shadow-none"
              aria-label={t("ai_canvas_select_artifact")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {artifacts.map((artifact) => (
                <SelectItem key={artifact.id} value={artifact.id}>
                  <ArtifactIcon kind={artifact.kind} />
                  {artifact.title ?? t(`ai_canvas_untitled_${artifact.kind}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeArtifact && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => void handleCopy()}
              aria-label={t("common_copy_clipboard")}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => downloadArtifact(activeArtifact, fallbackTitle)}
              aria-label={t("ai_canvas_download")}
            >
              <Download />
            </Button>
          </>
        )}

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
            aria-label={t("ai_canvas_close")}
          >
            <PanelRightClose />
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {!activeArtifact ? (
          <div className="text-muted-foreground flex h-full min-h-80 items-center justify-center p-8 text-center">
            <div className="max-w-sm space-y-4">
              <div className="mx-auto flex w-fit items-center gap-3">
                <FileText className="size-5" />
                <ImageIcon className="size-5" />
                <Film className="size-5" />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {t("ai_canvas_empty_title")}
                </p>
                <p className="mt-1 text-sm">
                  {t("ai_canvas_empty_description")}
                </p>
              </div>
            </div>
          </div>
        ) : activeArtifact.kind === "markdown" ? (
          <article className="bg-background mx-auto my-6 min-h-[calc(100%-3rem)] w-[min(46rem,calc(100%-3rem))] min-w-0 border px-8 py-10 sm:px-12">
            <div className="markdown-content max-w-none min-w-0 [overflow-wrap:anywhere] [&_pre]:max-w-full [&_pre]:overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children, ...props }) => (
                    <div className="max-w-full overflow-x-auto">
                      <table {...props}>{children}</table>
                    </div>
                  ),
                }}
              >
                {activeArtifact.content}
              </ReactMarkdown>
            </div>
          </article>
        ) : activeArtifact.kind === "image" ? (
          <div className="flex min-h-full items-center justify-center p-6">
            {/* Generated and tool-returned URLs can be data URLs or arbitrary HTTPS origins. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeArtifact.url}
              alt={activeArtifact.description ?? activeArtifact.title ?? ""}
              className="max-h-full max-w-full border object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6">
            <video
              src={activeArtifact.url}
              controls
              playsInline
              preload="metadata"
              className="max-h-full max-w-full border bg-black"
            />
            {activeArtifact.description && (
              <p className="text-muted-foreground max-w-xl text-sm">
                {activeArtifact.description}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
