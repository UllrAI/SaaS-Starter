"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  ChevronDown,
  CircleAlert,
  FileOutput,
  Loader2,
  PanelRightOpen,
  Send,
  Sparkles,
  Square,
  Wrench,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REASONING_EFFORTS, type ReasoningEffort } from "@/lib/ai/reasoning";
import { useTranslation } from "@/lib/i18n/translation/client";
import type { AiMessage } from "./chat-types";

interface ChatPanelProps {
  messages: AiMessage[];
  input: string;
  status: ChatStatus;
  error?: Error;
  reasoningEffort: ReasoningEffort;
  canvasCount: number;
  onInputChange: (value: string) => void;
  onReasoningEffortChange: (value: ReasoningEffort) => void;
  onSubmit: (text?: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onOpenCanvas: () => void;
  onOpenMessage: (message: AiMessage) => void;
  onOpenArtifact: (id: string) => void;
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
    <details ref={detailsRef} className="group my-2 text-sm">
      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-2 py-1">
        {streaming ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        <span>
          {streaming ? t("ai_chat_thinking") : t("ai_chat_reasoning")}
        </span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="text-muted-foreground border-l pl-4 whitespace-pre-wrap">
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
        <PanelRightOpen className="text-muted-foreground size-4" />
      </button>
    );
  }

  return (
    <div className="text-muted-foreground my-1 flex w-fit items-center gap-2 py-1 text-xs">
      {isError ? (
        <CircleAlert className="text-destructive size-3.5" />
      ) : isRunning ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Wrench className="size-3.5" />
      )}
      <span translate="no">
        {isError
          ? t("ai_chat_tool_error", { name })
          : isRunning
            ? t("ai_chat_tool_running", { name })
            : t("ai_chat_tool_result", { name })}
      </span>
    </div>
  );
}

function AssistantMessage({
  message,
  onOpenMessage,
  onOpenArtifact,
}: {
  message: AiMessage;
  onOpenMessage: (message: AiMessage) => void;
  onOpenArtifact: (id: string) => void;
}) {
  const { t } = useTranslation();
  const hasText = message.parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  return (
    <div className="group/message flex gap-3">
      <div className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center border">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0 flex-1 text-sm leading-6">
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <div
                key={`${message.id}-text-${index}`}
                className="markdown-content max-w-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_li]:text-sm [&_p]:mb-3 [&_p]:text-sm [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:p-4"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noreferrer">
                        {children}
                      </a>
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
                className="text-primary mr-2 text-xs underline underline-offset-4"
              >
                {part.title ?? part.url}
              </a>
            );
          }
          return null;
        })}

        {hasText && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-1 h-7 px-2 opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100"
            onClick={() => onOpenMessage(message)}
          >
            <PanelRightOpen />
            {t("ai_chat_open_in_canvas")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  input,
  status,
  error,
  reasoningEffort,
  canvasCount,
  onInputChange,
  onReasoningEffortChange,
  onSubmit,
  onStop,
  onRetry,
  onOpenCanvas,
  onOpenMessage,
  onOpenArtifact,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const suggestions = [
    t("ai_chat_suggestion_product"),
    t("ai_chat_suggestion_account"),
    t("ai_chat_suggestion_document"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status]);

  return (
    <section
      aria-label={t("ai_chat_conversation")}
      className="bg-background flex min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
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
            <div className="space-y-7">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="bg-muted max-w-[85%] border px-3 py-2 text-sm leading-6 whitespace-pre-wrap">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("\n")}
                    </div>
                  </div>
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    onOpenMessage={onOpenMessage}
                    onOpenArtifact={onOpenArtifact}
                  />
                ),
              )}
              {status === "submitted" && (
                <div className="text-muted-foreground flex items-center gap-3 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  {t("ai_chat_thinking")}
                </div>
              )}
              {error && (
                <div className="border-destructive/30 bg-destructive/5 flex items-center justify-between gap-3 border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <CircleAlert className="text-destructive size-4" />
                    {t("ai_chat_error_message")}
                  </span>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    {t("ai_chat_retry")}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="bg-background shrink-0 px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="bg-background focus-within:ring-ring/30 mx-auto max-w-3xl border focus-within:ring-2">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={t("ai_chat_input_placeholder")}
            className="max-h-48 min-h-20 resize-none border-0 px-3 py-3 shadow-none focus-visible:ring-0"
            rows={2}
          />
          <div className="flex items-center gap-2 border-t px-2 py-2">
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {REASONING_EFFORTS.map((effort) => (
                  <SelectItem key={effort} value={effort}>
                    {t(`ai_chat_reasoning_${effort}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onOpenCanvas}
            >
              <PanelRightOpen />
              {t("ai_canvas_title")}
              {canvasCount > 0 && (
                <span className="bg-muted flex size-5 items-center justify-center rounded-full text-xs">
                  {canvasCount}
                </span>
              )}
            </Button>

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
                  disabled={!input.trim()}
                  aria-label={t("ai_chat_send")}
                >
                  <Send />
                </Button>
              )}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mx-auto mt-2 max-w-3xl text-center text-[11px]">
          {t("ai_chat_disclaimer")}
        </p>
      </div>
    </section>
  );
}
