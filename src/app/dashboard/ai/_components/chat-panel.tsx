"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  FileOutput,
  History,
  ImagePlus,
  Loader2,
  Maximize2,
  PanelRightOpen,
  Send,
  ShieldQuestionMark,
  Sparkles,
  Square,
  Plus,
  RefreshCcw,
  Wrench,
  X,
} from "lucide-react";
import {
  getToolOrDynamicToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type ToolUIPart,
} from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FileUploadItem } from "@/components/ui/file-upload/types";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REASONING_EFFORTS, type ReasoningEffort } from "@/lib/ai/reasoning";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import {
  AI_IMAGE_INPUT_MAX_FILES,
  AI_IMAGE_INPUT_MEDIA_TYPES,
} from "@/lib/ai/image-input";
import { useTranslation } from "@/lib/i18n/translation/client";
import { cn } from "@/lib/utils";
import { findActiveToolApprovalId } from "./tool-approval";

interface ChatPanelProps {
  conversationId?: string;
  messages: AiMessage[];
  input: string;
  status: ChatStatus;
  error?: Error;
  reasoningEffort: ReasoningEffort;
  canvasCount: number;
  canvasOpen: boolean;
  conversationTitle?: string;
  conversationLoading: boolean;
  imageAttachments: FileUploadItem[];
  imageUploadsEnabled: boolean;
  imageUploadError: boolean;
  canAddImage: boolean;
  onAddImages: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onRetryImage: (id: string) => void;
  onInputChange: (value: string) => void;
  onReasoningEffortChange: (value: ReasoningEffort) => void;
  onSubmit: (text?: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onOpenCanvas: () => void;
  onOpenHistory: () => void;
  onNewConversation: () => void;
  onOpenMessage: (message: AiMessage) => void;
  onOpenArtifact: (id: string) => void;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
  className?: string;
}

interface PreviewImage {
  name: string;
  url: string;
}

function UserMessage({
  message,
  onPreviewImage,
}: {
  message: AiMessage;
  onPreviewImage: (image: PreviewImage, trigger: HTMLButtonElement) => void;
}) {
  const { t } = useTranslation();
  const files = message.parts.filter((part) => part.type === "file");
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  return (
    <div className="flex min-w-0 justify-end">
      <div className="bg-muted max-w-[85%] min-w-0 border p-2 text-sm leading-6">
        {files.length > 0 && (
          <div className="flex max-w-md flex-wrap justify-end gap-2">
            {files.map((file, index) => {
              const name = file.filename ?? t("ai_chat_reference_image");

              return (
                <button
                  key={`${message.id}-file-${index}`}
                  type="button"
                  onClick={(event) =>
                    onPreviewImage({ name, url: file.url }, event.currentTarget)
                  }
                  className="bg-background focus-visible:ring-ring group relative block size-24 shrink-0 cursor-zoom-in overflow-hidden border text-left transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={t("ai_chat_preview_image", { name })}
                >
                  <Image
                    src={file.url}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="96px"
                  />
                  <span className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-black/65 text-white shadow-sm transition-transform group-hover:scale-105 group-focus-visible:scale-105">
                    <Maximize2 className="size-3.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {text && (
          <div
            className={
              files.length > 0
                ? "mt-2 [overflow-wrap:anywhere] whitespace-pre-wrap"
                : "[overflow-wrap:anywhere] whitespace-pre-wrap"
            }
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageAttachmentPreview({
  item,
  onRemove,
  onRetry,
}: {
  item: FileUploadItem;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const imageUrl = item.previewUrl ?? item.uploadedFile?.url;

  return (
    <div className="bg-muted/30 relative size-20 shrink-0 overflow-hidden border">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={item.file.name}
          fill
          unoptimized
          className="object-cover"
          sizes="80px"
        />
      )}
      {(item.status === "queued" || item.status === "uploading") && (
        <div
          role="status"
          className="bg-background/70 absolute inset-0 flex flex-col items-center justify-center gap-1"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="text-[10px]" aria-hidden="true">
            {item.progress}%
          </span>
          <span className="sr-only">
            {t("ai_chat_image_uploading", {
              name: item.file.name,
              progress: item.progress,
            })}
          </span>
        </div>
      )}
      {item.status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-destructive/80 absolute inset-0 flex items-center justify-center text-white"
          aria-label={t("ai_chat_retry_image_upload", {
            name: item.file.name,
          })}
        >
          <RefreshCcw className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="bg-background/90 hover:bg-background absolute top-1 right-1 flex size-5 items-center justify-center border"
        aria-label={t("ai_chat_remove_image", { name: item.file.name })}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function ReasoningBlock({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = streaming;
    }
  }, [streaming]);

  return (
    <details ref={detailsRef} className="group mb-2 text-sm">
      <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer list-none items-center gap-1.5 py-1 transition-colors">
        {streaming ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        <span aria-live="polite">
          {streaming ? t("ai_chat_thinking") : t("ai_chat_reasoning")}
        </span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="text-muted-foreground mt-1 border-l pl-3 text-xs leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {text}
      </div>
    </details>
  );
}

function ToolCallRow({
  part,
  onOpenArtifact,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  onOpenArtifact: (id: string) => void;
}) {
  const { t } = useTranslation();
  const name = getToolOrDynamicToolName(part);
  const isRunning =
    part.state === "input-streaming" || part.state === "input-available";
  const isError = part.state === "output-error";
  const isArtifact =
    part.state === "output-available" &&
    (name === "presentArtifact" || name === "generateImage");

  if (isArtifact) {
    return (
      <button
        type="button"
        onClick={() => onOpenArtifact(part.toolCallId)}
        className="bg-muted/40 hover:bg-muted my-2 flex w-full items-center gap-3 border px-3 py-2 text-left text-sm transition-colors"
      >
        <FileOutput className="text-muted-foreground size-4" />
        <span className="flex-1">
          {name === "generateImage"
            ? t("ai_chat_image_ready")
            : t("ai_chat_artifact_ready")}
        </span>
        <PanelRightOpen className="text-muted-foreground size-4 rotate-180" />
      </button>
    );
  }

  return (
    <div
      role={isError ? "alert" : "status"}
      className="text-muted-foreground my-1 flex w-fit max-w-full min-w-0 items-center gap-2 py-1 text-xs"
    >
      {isError ? (
        <CircleAlert className="text-destructive size-3.5" />
      ) : isRunning ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Wrench className="size-3.5" />
      )}
      <span className="min-w-0 [overflow-wrap:anywhere]" translate="no">
        {isError
          ? t("ai_chat_tool_error", { name })
          : isRunning
            ? t("ai_chat_tool_running", { name })
            : t("ai_chat_tool_result", { name })}
      </span>
    </div>
  );
}

/** The tool states that carry an `approval` object. */
type ApprovalToolUIPart = Extract<
  ToolUIPart | DynamicToolUIPart,
  { state: "approval-requested" | "approval-responded" | "output-denied" }
>;

function ToolApprovalCard({
  part,
  isActive,
  disabled,
  onRespond,
}: {
  part: ApprovalToolUIPart;
  isActive: boolean;
  disabled: boolean;
  onRespond: (approvalId: string, approved: boolean) => void;
}) {
  const { t } = useTranslation();
  const name = getToolOrDynamicToolName(part);
  // Every approval-gated tool so far names the resource it would create. Show
  // that instead of the raw input: the point of the card is that the user can
  // tell what is about to happen without reading JSON.
  const target =
    part.input && typeof part.input === "object" && "fileName" in part.input
      ? String((part.input as { fileName: unknown }).fileName)
      : undefined;

  if (part.state === "approval-requested") {
    return (
      <div
        role="group"
        aria-label={t("ai_chat_tool_approval_title")}
        className="bg-muted/40 my-2 min-w-0 border px-3 py-2.5 text-sm"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <ShieldQuestionMark className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t("ai_chat_tool_approval_title")}</p>
            <p className="text-muted-foreground mt-0.5 [overflow-wrap:anywhere]">
              {target
                ? t("ai_chat_tool_approval_target", { name, target })
                : t("ai_chat_tool_approval_description", { name })}
            </p>
          </div>
        </div>
        {isActive ? (
          <div className="mt-2.5 flex flex-wrap gap-2 pl-6.5">
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              onClick={() => onRespond(part.approval.id, true)}
            >
              {t("ai_chat_tool_approval_allow")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onRespond(part.approval.id, false)}
            >
              {t("ai_chat_tool_approval_deny")}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 pl-6.5 text-xs">
            {t("ai_chat_tool_approval_queued")}
          </p>
        )}
      </div>
    );
  }

  // A refusal stays in `approval-responded` until the server echoes back
  // `output-denied`, so this branch reads the answer rather than the state.
  if (part.state === "output-denied" || !part.approval.approved) {
    return (
      <div
        role="status"
        className="text-muted-foreground my-1 flex w-fit max-w-full min-w-0 items-center gap-2 py-1 text-xs"
      >
        <Wrench className="size-3.5" />
        <span className="min-w-0 [overflow-wrap:anywhere]" translate="no">
          {t("ai_chat_tool_denied", { name })}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="text-muted-foreground my-1 flex w-fit max-w-full min-w-0 items-center gap-2 py-1 text-xs"
    >
      <Loader2 className="size-3.5 animate-spin" />
      <span className="min-w-0 [overflow-wrap:anywhere]" translate="no">
        {t("ai_chat_tool_running", { name })}
      </span>
    </div>
  );
}

function AssistantMessage({
  message,
  activeApprovalId,
  approvalsDisabled,
  onOpenMessage,
  onOpenArtifact,
  onRespondToApproval,
}: {
  message: AiMessage;
  activeApprovalId?: string;
  approvalsDisabled: boolean;
  onOpenMessage: (message: AiMessage) => void;
  onOpenArtifact: (id: string) => void;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
}) {
  const { t } = useTranslation();
  const hasText = message.parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  return (
    <div className="min-w-0 text-sm leading-6">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <div
              key={`${message.id}-text-${index}`}
              className="markdown-content max-w-none min-w-0 [overflow-wrap:anywhere] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_li]:text-sm [&_p]:mb-3 [&_p]:text-sm [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:p-4"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ children, ...props }) => (
                    <a {...props} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                  table: ({ children, ...props }) => (
                    <div className="max-w-full overflow-x-auto">
                      <table {...props}>{children}</table>
                    </div>
                  ),
                }}
              >
                {part.text}
              </ReactMarkdown>
            </div>
          );
        }
        if (part.type === "reasoning") {
          return (
            <ReasoningBlock
              key={`${message.id}-reasoning-${index}`}
              text={part.text}
              streaming={part.state === "streaming"}
            />
          );
        }
        if (isToolUIPart(part)) {
          if (
            part.state === "approval-requested" ||
            part.state === "approval-responded" ||
            part.state === "output-denied"
          ) {
            return (
              <ToolApprovalCard
                key={part.toolCallId}
                part={part}
                isActive={part.approval.id === activeApprovalId}
                disabled={approvalsDisabled}
                onRespond={onRespondToApproval}
              />
            );
          }
          return (
            <ToolCallRow
              key={part.toolCallId}
              part={part}
              onOpenArtifact={() => onOpenArtifact(`${message.id}:${index}`)}
            />
          );
        }
        if (part.type === "source-url") {
          return (
            <a
              key={part.sourceId}
              href={part.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary mr-2 text-xs break-all underline underline-offset-4"
            >
              {part.title ?? part.url}
            </a>
          );
        }
        return null;
      })}

      {hasText && (
        <div
          role="group"
          className="text-muted-foreground mt-1 flex min-h-8 items-center gap-1"
          aria-label={t("ai_chat_message_actions")}
        >
          <CopyButton textToCopy={text} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onOpenMessage(message)}
          >
            <PanelRightOpen className="rotate-180" />
            {t("ai_chat_open_in_canvas")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  conversationId,
  messages,
  input,
  status,
  error,
  reasoningEffort,
  canvasCount,
  canvasOpen,
  conversationTitle,
  conversationLoading,
  imageAttachments,
  imageUploadsEnabled,
  imageUploadError,
  canAddImage,
  onAddImages,
  onRemoveImage,
  onRetryImage,
  onInputChange,
  onReasoningEffortChange,
  onSubmit,
  onStop,
  onRetry,
  onOpenCanvas,
  onOpenHistory,
  onNewConversation,
  onOpenMessage,
  onOpenArtifact,
  onRespondToApproval,
  className,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement>(null);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const isBusy = status === "submitted" || status === "streaming";
  const imageAttachmentsReady = imageAttachments.every(
    (item) => item.status === "success",
  );
  const hasReadyImage = imageAttachments.some(
    (item) => item.status === "success",
  );
  const activeApprovalId = findActiveToolApprovalId(messages);
  const canSubmit =
    !isBusy &&
    !conversationLoading &&
    imageAttachmentsReady &&
    // A new turn would slice past the paused tool call and leave it dangling.
    // The user answers the pending approval first, either way.
    !activeApprovalId &&
    (Boolean(input.trim()) || hasReadyImage);
  const suggestions = [
    t("ai_chat_suggestion_product"),
    t("ai_chat_suggestion_account"),
    t("ai_chat_suggestion_document"),
  ];
  let latestUserMessageId: string | undefined;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      latestUserMessageId = messages[index].id;
      break;
    }
  }

  return (
    <section
      aria-label={t("ai_chat_conversation")}
      className={cn(
        "bg-background flex min-h-0 min-w-0 flex-col overflow-hidden",
        className,
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 xl:hidden"
          onClick={onOpenHistory}
          aria-label={t("ai_history_open")}
        >
          <History />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {conversationTitle ?? t("ai_history_untitled")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2", canvasOpen && "xl:hidden")}
          onClick={onOpenCanvas}
          aria-label={t("ai_canvas_open")}
        >
          <PanelRightOpen className="rotate-180" />
          <span className="hidden sm:inline">{t("ai_canvas_title")}</span>
          {canvasCount > 0 && (
            <span className="bg-muted flex min-w-5 items-center justify-center rounded-full px-1 text-xs">
              {canvasCount}
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 xl:hidden"
          onClick={onNewConversation}
          disabled={isBusy || conversationLoading || !imageAttachmentsReady}
          aria-label={t("ai_history_new")}
        >
          <Plus />
        </Button>
      </div>

      <MessageScrollerProvider
        key={conversationId ?? "new-conversation"}
        autoScroll
        defaultScrollPosition="last-anchor"
      >
        <MessageScroller className="min-h-0 min-w-0 flex-1">
          <MessageScrollerViewport
            aria-label={t("ai_chat_messages")}
            className="overflow-x-hidden"
          >
            <MessageScrollerContent
              aria-busy={conversationLoading || isBusy}
              className="mx-auto w-full max-w-3xl min-w-0 px-4 py-6 sm:px-6 xl:max-w-4xl"
            >
              {conversationLoading ? (
                <div
                  role="status"
                  className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("ai_history_loading_conversation")}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 flex-col justify-end pb-6 sm:justify-center sm:pb-0">
                  <div className="max-w-lg">
                    <div className="bg-muted mb-4 flex size-10 items-center justify-center border">
                      <Sparkles className="size-5" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {t("ai_chat_empty_title")}
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {t("ai_chat_empty_description")}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto min-h-8 text-left whitespace-normal"
                          onClick={() => onSubmit(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.id === latestUserMessageId}
                    >
                      {message.role === "user" ? (
                        <UserMessage
                          message={message}
                          onPreviewImage={(image, trigger) => {
                            previewTriggerRef.current = trigger;
                            setPreviewImage(image);
                            setImagePreviewOpen(true);
                          }}
                        />
                      ) : (
                        <AssistantMessage
                          message={message}
                          activeApprovalId={activeApprovalId}
                          approvalsDisabled={isBusy}
                          onOpenMessage={onOpenMessage}
                          onOpenArtifact={onOpenArtifact}
                          onRespondToApproval={onRespondToApproval}
                        />
                      )}
                    </MessageScrollerItem>
                  ))}
                  {status === "submitted" && (
                    <div
                      role="status"
                      className="text-muted-foreground flex items-center gap-3 text-sm"
                    >
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t("ai_chat_thinking")}
                    </div>
                  )}
                  {error && (
                    <div
                      role="alert"
                      className="border-destructive/30 bg-destructive/5 flex min-w-0 items-center justify-between gap-3 border px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
                        <CircleAlert
                          className="text-destructive size-4"
                          aria-hidden="true"
                        />
                        {t("ai_chat_error_message")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={onRetry}
                      >
                        {t("ai_chat_retry")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label={t("ai_chat_scroll_to_latest")} />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="bg-background min-w-0 shrink-0 px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="bg-background focus-within:ring-ring/30 mx-auto max-w-3xl min-w-0 border focus-within:ring-2 xl:max-w-4xl">
          {imageAttachments.length > 0 && (
            <div
              className="flex max-w-full gap-2 overflow-x-auto border-b p-2"
              aria-label={t("ai_chat_reference_images")}
            >
              {imageAttachments.map((item) => (
                <ImageAttachmentPreview
                  key={item.id}
                  item={item}
                  onRemove={() => onRemoveImage(item.id)}
                  onRetry={() => onRetryImage(item.id)}
                />
              ))}
            </div>
          )}
          {imageUploadError && (
            <p
              role="alert"
              className="text-destructive border-b px-3 py-2 text-xs"
            >
              {t("ai_chat_image_upload_failed")}
            </p>
          )}
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            aria-label={t("ai_chat_input_label")}
            placeholder={t("ai_chat_input_placeholder")}
            className="field-sizing-content max-h-48 min-h-20 resize-none border-0 px-3 py-3 shadow-none focus-visible:ring-0"
            rows={2}
          />
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-t px-2 py-2">
            {imageUploadsEnabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={AI_IMAGE_INPUT_MEDIA_TYPES.join(",")}
                  multiple
                  className="sr-only"
                  aria-label={t("ai_chat_attach_images")}
                  onChange={(event) => {
                    if (event.currentTarget.files) {
                      onAddImages(event.currentTarget.files);
                    }
                    event.currentTarget.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAddImage}
                  aria-label={t("ai_chat_attach_images")}
                  title={t("ai_chat_attach_images_hint", {
                    count: AI_IMAGE_INPUT_MAX_FILES,
                  })}
                >
                  <ImagePlus className="size-3.5" />
                  <span className="hidden sm:inline">
                    {t("ai_chat_attach_images")}
                  </span>
                </Button>
              </>
            )}

            <Select
              value={reasoningEffort}
              onValueChange={(value) =>
                onReasoningEffortChange(value as ReasoningEffort)
              }
            >
              <SelectTrigger
                size="sm"
                className="h-8 border-0 px-2 shadow-none"
                aria-label={t("ai_chat_reasoning_effort")}
              >
                <Sparkles className="size-3.5" />
                <span>{t(`ai_chat_reasoning_${reasoningEffort}_short`)}</span>
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {REASONING_EFFORTS.map((effort) => (
                  <SelectItem key={effort} value={effort}>
                    {t(`ai_chat_reasoning_${effort}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto">
              {isBusy ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={onStop}
                  aria-label={t("ai_chat_stop")}
                >
                  <Square />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  className="size-8"
                  onClick={() => onSubmit()}
                  disabled={!canSubmit}
                  aria-label={t("ai_chat_send")}
                >
                  <Send />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent
          className="w-[min(92vw,80rem)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden border-black/20 bg-black p-0 text-white shadow-2xl sm:max-w-[min(92vw,80rem)] [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-black/65 [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:ring-offset-black"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            previewTriggerRef.current?.focus();
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {previewImage?.name ?? t("ai_chat_reference_image")}
            </DialogTitle>
            <DialogDescription>
              {t("ai_chat_image_preview_description", {
                name: previewImage?.name ?? t("ai_chat_reference_image"),
              })}
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <>
              <div className="relative h-[min(80dvh,56rem)] min-h-64 w-full">
                <Image
                  src={previewImage.url}
                  alt={previewImage.name}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="92vw"
                  priority
                />
              </div>
              <div className="truncate border-t border-white/10 px-4 py-2.5 text-sm text-white/80">
                {previewImage.name}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
