"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  AiConversationDetail,
  AiConversationPage,
  AiConversationSummary,
  AiMessage,
} from "@/lib/ai/chat-history-types";
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
import { ConversationSidebar } from "./conversation-sidebar";

const HISTORY_PAGE_SIZE = 30;
const CONVERSATION_QUERY_KEY = "conversation";

function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return REASONING_EFFORTS.some((effort) => effort === value);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

async function fetchConversationPage(offset: number) {
  const search = new URLSearchParams({
    offset: String(offset),
    limit: String(HISTORY_PAGE_SIZE),
  });
  return readResponse<AiConversationPage>(
    await fetch(`/api/ai/conversations?${search}`, { cache: "no-store" }),
  );
}

async function fetchConversation(conversationId: string) {
  return readResponse<AiConversationDetail>(
    await fetch(`/api/ai/conversations/${encodeURIComponent(conversationId)}`, {
      cache: "no-store",
    }),
  );
}

async function createConversation() {
  const payload = await readResponse<{ conversation: AiConversationSummary }>(
    await fetch("/api/ai/conversations", { method: "POST" }),
  );
  return payload.conversation;
}

function replaceConversationUrl(conversationId?: string) {
  const url = new URL(window.location.href);
  if (conversationId) {
    url.searchParams.set(CONVERSATION_QUERY_KEY, conversationId);
  } else {
    url.searchParams.delete(CONVERSATION_QUERY_KEY);
  }
  window.history.replaceState(window.history.state, "", url);
}

function titleFromText(text: string) {
  return Array.from(text.replace(/\s+/g, " ").trim()).slice(0, 80).join("");
}

export function AiChat() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    DEFAULT_REASONING_EFFORT,
  );
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationCreating, setConversationCreating] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [loadedConversationCount, setLoadedConversationCount] = useState(0);
  const [manualArtifacts, setManualArtifacts] = useState<CanvasArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>();
  const [desktopCanvasOpen, setDesktopCanvasOpen] = useState(true);
  const [mobileCanvasOpen, setMobileCanvasOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const latestAutomaticArtifactId = useRef<string | undefined>(undefined);
  const conversationRequestId = useRef(0);

  const refreshConversationList = useCallback(async () => {
    try {
      const page = await fetchConversationPage(0);
      setConversations((current) => {
        const active = current.find(
          (conversation) => conversation.id === activeConversationId,
        );
        return active &&
          !page.conversations.some((item) => item.id === active.id)
          ? [active, ...page.conversations]
          : page.conversations;
      });
      setLoadedConversationCount(page.conversations.length);
      setHistoryHasMore(page.hasMore);
      setHistoryError(false);
    } catch (refreshError) {
      console.error(
        "AI conversation list could not be refreshed:",
        refreshError,
      );
      setHistoryError(true);
    }
  }, [activeConversationId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AiMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({
          messages,
          trigger,
          messageId,
          body,
        }) => {
          if (typeof body?.conversationId !== "string") {
            throw new Error("A conversation is required.");
          }
          return {
            body: prepareChatRequest({
              messages,
              trigger,
              messageId,
              conversationId: body.conversationId,
              reasoningEffort: isReasoningEffort(body.reasoningEffort)
                ? body.reasoningEffort
                : DEFAULT_REASONING_EFFORT,
            }),
          };
        },
      }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    clearError,
  } = useChat<AiMessage>({
    transport,
    onFinish: () => {
      void refreshConversationList();
    },
  });

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
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const isBusy = status === "submitted" || status === "streaming";
  const historyDisabled =
    historyLoading || isBusy || conversationLoading || conversationCreating;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setHistoryLoading(true);
      try {
        const page = await fetchConversationPage(0);
        if (cancelled) return;

        setLoadedConversationCount(page.conversations.length);
        setHistoryHasMore(page.hasMore);
        const requestedId = new URL(window.location.href).searchParams.get(
          CONVERSATION_QUERY_KEY,
        );
        let targetId = requestedId ?? page.conversations[0]?.id;
        let detail: AiConversationDetail | null = null;

        if (targetId) {
          try {
            detail = await fetchConversation(targetId);
          } catch {
            targetId = page.conversations[0]?.id;
            detail = targetId ? await fetchConversation(targetId) : null;
          }
        }
        if (cancelled) return;

        const nextConversations =
          detail &&
          !page.conversations.some(
            (conversation) => conversation.id === detail?.conversation.id,
          )
            ? [detail.conversation, ...page.conversations]
            : page.conversations;
        setConversations(nextConversations);
        setActiveConversationId(detail?.conversation.id);
        setMessages(detail?.messages ?? []);
        replaceConversationUrl(detail?.conversation.id);
        setHistoryError(false);
      } catch (initializationError) {
        if (cancelled) return;
        console.error(
          "AI conversation history could not be loaded:",
          initializationError,
        );
        setHistoryError(true);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setMessages]);

  useEffect(() => {
    const refreshOnFocus = () => void refreshConversationList();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [refreshConversationList]);

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

  const resetConversationView = useCallback(() => {
    setMessages([]);
    setManualArtifacts([]);
    setActiveArtifactId(undefined);
    latestAutomaticArtifactId.current = undefined;
    clearError();
  }, [clearError, setMessages]);

  const handleSelectConversation = async (conversationId: string) => {
    if (historyDisabled) return;

    const requestId = ++conversationRequestId.current;
    setConversationLoading(true);
    setHistoryError(false);
    try {
      const detail = await fetchConversation(conversationId);
      if (requestId !== conversationRequestId.current) return;

      resetConversationView();
      setMessages(detail.messages);
      setActiveConversationId(detail.conversation.id);
      setConversations((current) => {
        const selectedIndex = current.findIndex(
          (conversation) => conversation.id === detail.conversation.id,
        );
        if (selectedIndex < 0) return [detail.conversation, ...current];

        return current.map((conversation, index) =>
          index === selectedIndex ? detail.conversation : conversation,
        );
      });
      replaceConversationUrl(detail.conversation.id);
      setMobileHistoryOpen(false);
    } catch (selectionError) {
      console.error("AI conversation could not be loaded:", selectionError);
      setHistoryError(true);
    } finally {
      if (requestId === conversationRequestId.current) {
        setConversationLoading(false);
      }
    }
  };

  const handleNewConversation = () => {
    if (historyDisabled) return;
    conversationRequestId.current += 1;
    setActiveConversationId(undefined);
    setInput("");
    resetConversationView();
    replaceConversationUrl();
    setMobileHistoryOpen(false);
  };

  const handleLoadMore = async () => {
    if (historyLoadingMore || !historyHasMore) return;
    setHistoryLoadingMore(true);
    try {
      const page = await fetchConversationPage(loadedConversationCount);
      setConversations((current) => {
        const byId = new Map(current.map((item) => [item.id, item]));
        page.conversations.forEach((item) => byId.set(item.id, item));
        return [...byId.values()];
      });
      setLoadedConversationCount(
        (current) => current + page.conversations.length,
      );
      setHistoryHasMore(page.hasMore);
    } catch (loadMoreError) {
      console.error(
        "More AI conversations could not be loaded:",
        loadMoreError,
      );
      setHistoryError(true);
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  const openCanvasForCurrentViewport = () => {
    if (window.matchMedia("(min-width: 64rem)").matches) {
      setDesktopCanvasOpen(true);
    } else {
      setMobileCanvasOpen(true);
    }
  };

  const handleSubmit = async (suggestedText?: string) => {
    const text = (suggestedText ?? input).trim();
    if (
      !text ||
      historyLoading ||
      isBusy ||
      conversationLoading ||
      conversationCreating
    ) {
      return;
    }

    clearError();
    let conversationId = activeConversationId;
    if (!conversationId) {
      setConversationCreating(true);
      try {
        const created = await createConversation();
        conversationId = created.id;
        setActiveConversationId(created.id);
        setConversations((current) => [created, ...current]);
        setLoadedConversationCount((current) => current + 1);
        replaceConversationUrl(created.id);
      } catch (creationError) {
        console.error("AI conversation could not be created:", creationError);
        setHistoryError(true);
        return;
      } finally {
        setConversationCreating(false);
      }
    }

    const optimisticTitle = titleFromText(text);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: conversation.title ?? optimisticTitle,
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
    );
    setInput("");
    void sendMessage({ text }, { body: { reasoningEffort, conversationId } });
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

  const sidebarProps = {
    conversations,
    activeConversationId,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    hasMore: historyHasMore,
    disabled: historyDisabled,
    error: historyError,
    onNew: handleNewConversation,
    onSelect: (conversationId: string) =>
      void handleSelectConversation(conversationId),
    onLoadMore: () => void handleLoadMore(),
  };

  return (
    <div
      className={cn(
        "grid min-h-0 w-full flex-1 overflow-hidden border-y lg:border",
        desktopCanvasOpen
          ? "lg:grid-cols-[minmax(20rem,0.8fr)_minmax(28rem,1.2fr)] xl:grid-cols-[14rem_minmax(20rem,0.8fr)_minmax(28rem,1.2fr)]"
          : "lg:grid-cols-1 xl:grid-cols-[14rem_minmax(0,1fr)]",
      )}
    >
      <ConversationSidebar
        {...sidebarProps}
        className="hidden border-r xl:flex"
      />

      <ChatPanel
        messages={messages}
        input={input}
        status={status}
        error={error}
        reasoningEffort={reasoningEffort}
        canvasCount={artifacts.length}
        conversationTitle={activeConversation?.title ?? undefined}
        conversationLoading={
          historyLoading || conversationLoading || conversationCreating
        }
        onInputChange={setInput}
        onReasoningEffortChange={setReasoningEffort}
        onSubmit={handleSubmit}
        onStop={() => void stop()}
        onRetry={() => {
          if (!activeConversationId) return;
          clearError();
          void regenerate({
            body: { reasoningEffort, conversationId: activeConversationId },
          });
        }}
        onOpenCanvas={openCanvasForCurrentViewport}
        onOpenHistory={() => setMobileHistoryOpen(true)}
        onNewConversation={handleNewConversation}
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

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm gap-0 p-0 xl:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("ai_history_title")}</SheetTitle>
            <SheetDescription>{t("ai_history_description")}</SheetDescription>
          </SheetHeader>
          <ConversationSidebar {...sidebarProps} className="flex h-full" />
        </SheetContent>
      </Sheet>

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
