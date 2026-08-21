"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
  type ReasoningEffort,
} from "@/lib/ai/reasoning";
import { useTranslation } from "@/lib/i18n/translation/client";
import { cn } from "@/lib/utils";
import {
  createMarkdownArtifact,
  extractArtifacts,
  type CanvasArtifact,
} from "./artifacts";
import { CanvasPanel } from "./canvas-panel";
import { ChatPanel } from "./chat-panel";
import { prepareChatRequest } from "./chat-request";
import type { AiMessage } from "./chat-types";

function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return REASONING_EFFORTS.some((effort) => effort === value);
}

export function AiChat() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    DEFAULT_REASONING_EFFORT,
  );
  const [manualArtifacts, setManualArtifacts] = useState<CanvasArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>();
  const [desktopCanvasOpen, setDesktopCanvasOpen] = useState(true);
  const [mobileCanvasOpen, setMobileCanvasOpen] = useState(false);
  const latestAutomaticArtifactId = useRef<string | undefined>(undefined);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AiMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({
          messages,
          trigger,
          messageId,
          body,
        }) => ({
          body: prepareChatRequest({
            messages,
            trigger,
            messageId,
            reasoningEffort: isReasoningEffort(body?.reasoningEffort)
              ? body.reasoningEffort
              : DEFAULT_REASONING_EFFORT,
          }),
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
    useChat<AiMessage>({ transport });
  const automaticArtifacts = useMemo(
    () => extractArtifacts(messages),
    [messages],
  );
  const artifacts = useMemo(() => {
    const byId = new Map<string, CanvasArtifact>();
    [...automaticArtifacts, ...manualArtifacts].forEach((artifact) =>
      byId.set(artifact.id, artifact),
    );
    return [...byId.values()];
  }, [automaticArtifacts, manualArtifacts]);

  useEffect(() => {
    const latestArtifact = automaticArtifacts.at(-1);
    if (
      !latestArtifact ||
      latestArtifact.id === latestAutomaticArtifactId.current
    ) {
      return;
    }

    latestAutomaticArtifactId.current = latestArtifact.id;
    setActiveArtifactId(latestArtifact.id);
    setDesktopCanvasOpen(true);
  }, [automaticArtifacts]);

  const openCanvasForCurrentViewport = () => {
    if (window.matchMedia("(min-width: 64rem)").matches) {
      setDesktopCanvasOpen(true);
    } else {
      setMobileCanvasOpen(true);
    }
  };

  const handleSubmit = (suggestedText?: string) => {
    const text = (suggestedText ?? input).trim();
    const isBusy = status === "submitted" || status === "streaming";
    if (!text || isBusy) return;

    clearError();
    void sendMessage({ text }, { body: { reasoningEffort } });
    setInput("");
  };

  const handleOpenMessage = (message: AiMessage) => {
    const artifact = createMarkdownArtifact(
      message,
      t("ai_canvas_assistant_response"),
    );
    if (!artifact) return;

    setManualArtifacts((current) => {
      const withoutExisting = current.filter((item) => item.id !== artifact.id);
      return [...withoutExisting, artifact];
    });
    setActiveArtifactId(artifact.id);
    openCanvasForCurrentViewport();
  };

  const handleOpenArtifact = (id: string) => {
    const artifact = artifacts.find((item) => item.id === id);
    if (!artifact) return;
    setActiveArtifactId(artifact.id);
    openCanvasForCurrentViewport();
  };

  return (
    <div
      className={cn(
        "grid min-h-0 w-full flex-1 overflow-hidden border-y lg:border",
        desktopCanvasOpen
          ? "lg:grid-cols-[minmax(22rem,0.8fr)_minmax(32rem,1.2fr)]"
          : "lg:grid-cols-1",
      )}
    >
      <ChatPanel
        messages={messages}
        input={input}
        status={status}
        error={error}
        reasoningEffort={reasoningEffort}
        canvasCount={artifacts.length}
        onInputChange={setInput}
        onReasoningEffortChange={setReasoningEffort}
        onSubmit={handleSubmit}
        onStop={() => void stop()}
        onRetry={() => {
          clearError();
          void regenerate({ body: { reasoningEffort } });
        }}
        onOpenCanvas={openCanvasForCurrentViewport}
        onOpenMessage={handleOpenMessage}
        onOpenArtifact={handleOpenArtifact}
      />

      {desktopCanvasOpen && (
        <CanvasPanel
          artifacts={artifacts}
          activeArtifactId={activeArtifactId}
          onSelectArtifact={setActiveArtifactId}
          onClose={() => setDesktopCanvasOpen(false)}
          className="hidden border-l lg:flex"
        />
      )}

      <Sheet open={mobileCanvasOpen} onOpenChange={setMobileCanvasOpen}>
        <SheetContent className="w-full max-w-none gap-0 p-0 sm:max-w-none lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("ai_canvas_title")}</SheetTitle>
            <SheetDescription>
              {t("ai_canvas_empty_description")}
            </SheetDescription>
          </SheetHeader>
          <CanvasPanel
            artifacts={artifacts}
            activeArtifactId={activeArtifactId}
            onSelectArtifact={setActiveArtifactId}
            className="flex h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
