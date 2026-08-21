"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolOrDynamicToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { Bot, CircleAlert, Loader2, Send, Square, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/translation/client";
import { cn } from "@/lib/utils";

function ToolCallChip({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const { t } = useTranslation();
  const name = getToolOrDynamicToolName(part);
  const isSettled =
    part.state === "output-available" || part.state === "output-error";

  return (
    <div className="border-border bg-muted/50 text-muted-foreground my-1 flex w-fit items-center gap-2 rounded-md border px-2 py-1 text-xs">
      {part.state === "output-error" ? (
        <CircleAlert className="text-destructive size-3.5" />
      ) : isSettled ? (
        <Wrench className="size-3.5" />
      ) : (
        <Loader2 className="size-3.5 animate-spin" />
      )}
      <span translate="no">
        {part.state === "output-error"
          ? t("ai_chat_tool_error", { name })
          : isSettled
            ? t("ai_chat_tool_result", { name })
            : t("ai_chat_tool_running", { name })}
      </span>
    </div>
  );
}

function MessageParts({ message }: { message: UIMessage }) {
  const { t } = useTranslation();

  return (
    <>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return message.role === "assistant" ? (
            <div
              key={index}
              className="prose prose-sm prose-slate dark:prose-invert max-w-none [&_pre]:max-w-full [&_pre]:overflow-x-auto"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>
          ) : (
            <p key={index} className="whitespace-pre-wrap">
              {part.text}
            </p>
          );
        }
        if (part.type === "reasoning") {
          return (
            <p key={index} className="text-muted-foreground text-xs italic">
              {t("ai_chat_thinking")}
            </p>
          );
        }
        if (isToolUIPart(part)) {
          return <ToolCallChip key={index} part={part} />;
        }
        return null;
      })}
    </>
  );
}

export function AiChat() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isBusy) {
      return;
    }
    clearError();
    void sendMessage({ text });
    setInput("");
  };

  return (
    <div className="border-border bg-card flex h-[calc(100dvh-11rem)] min-h-96 flex-col rounded-lg border">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center">
            <Bot className="size-8" />
            <p className="text-foreground font-medium">
              {t("ai_chat_empty_title")}
            </p>
            <p className="max-w-sm text-sm">{t("ai_chat_empty_description")}</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50",
              )}
            >
              <MessageParts message={message} />
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
        {error && (
          <div className="border-destructive/30 bg-destructive/10 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <CircleAlert className="text-destructive size-4" />
              {t("ai_chat_error_message")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearError();
                void regenerate();
              }}
            >
              {t("ai_chat_retry")}
            </Button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-border flex items-end gap-2 border-t p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t("ai_chat_input_placeholder")}
          className="max-h-40 min-h-10 resize-none"
          rows={1}
        />
        {isBusy ? (
          <Button
            variant="outline"
            size="icon"
            onClick={() => void stop()}
            aria-label={t("ai_chat_stop")}
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim()}
            aria-label={t("ai_chat_send")}
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
