"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type FileUIPart,
} from "ai";
import { useFileUpload } from "@/components/ui/file-upload/use-file-upload";
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
  AI_IMAGE_INPUT_MAX_FILES,
  AI_IMAGE_INPUT_MEDIA_TYPES,
} from "@/lib/ai/image-input";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
  type ReasoningEffort,
} from "@/lib/ai/reasoning";
import { useTranslation } from "@/lib/i18n/translation/client";
import { SITE_CONFIG } from "@/lib/config/site";
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
import {
  canvasPercentFromPointer,
  clampCanvasPercent,
  DEFAULT_CANVAS_PERCENT,
  MAX_CANVAS_PERCENT,
  MIN_CANVAS_PERCENT,
  shouldOpenDesktopCanvas,
} from "./workspace-layout";

const HISTORY_PAGE_SIZE = 30;
const CONVERSATION_QUERY_KEY = "conversation";
const HISTORY_COLLAPSED_STORAGE_KEY = "ai-workspace-history-collapsed";
const CANVAS_OPEN_STORAGE_KEY = "ai-workspace-canvas-open";
const CANVAS_PERCENT_STORAGE_KEY = "ai-workspace-canvas-percent";
const LAYOUT_PREFERENCE_EVENT = "ai-workspace-layout-preference";

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(LAYOUT_PREFERENCE_EVENT));
  } catch {
    // Layout preferences are non-critical when storage is unavailable.
  }
}

function readStoredBoolean(key: string) {
  const value = readStoredValue(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function subscribeToStoredValues(onChange: () => void) {
  const handleChange = () => onChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(LAYOUT_PREFERENCE_EVENT, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LAYOUT_PREFERENCE_EVENT, handleChange);
  };
}

function useStoredBoolean(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const syncValue = () => {
      setValue(readStoredBoolean(key) ?? defaultValue);
    };

    syncValue();
    return subscribeToStoredValues(syncValue);
  }, [defaultValue, key]);

  return value;
}

function readStoredCanvasPercent() {
  const value = readStoredValue(CANVAS_PERCENT_STORAGE_KEY);
  if (value === null) return DEFAULT_CANVAS_PERCENT;

  const percent = Number(value);
  return Number.isFinite(percent)
    ? clampCanvasPercent(percent)
    : DEFAULT_CANVAS_PERCENT;
}

function useStoredCanvasPercent() {
  const [value, setValue] = useState(DEFAULT_CANVAS_PERCENT);

  useEffect(() => {
    const syncValue = () => {
      setValue(readStoredCanvasPercent());
    };

    syncValue();
    return subscribeToStoredValues(syncValue);
  }, []);

  return value;
}

function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return REASONING_EFFORTS.some((effort) => effort === value);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

async function fetchConversationPage(offset: number, archived: boolean) {
  const search = new URLSearchParams({
    offset: String(offset),
    limit: String(HISTORY_PAGE_SIZE),
    archived: String(archived),
  });
  return readResponse<AiConversationPage>(
    await fetch(`/api/ai/conversations?${search}`, { cache: "no-store" }),
  );
}

async function updateConversationArchive(
  conversationId: string,
  archived: boolean,
) {
  const payload = await readResponse<{ conversation: AiConversationSummary }>(
    await fetch(`/api/ai/conversations/${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    }),
  );
  return payload.conversation;
}

async function fetchConversation(conversationId: string, before?: string) {
  return readResponse<AiConversationDetail>(
    await fetch(
      `/api/ai/conversations/${encodeURIComponent(conversationId)}${before ? `?before=${encodeURIComponent(before)}` : ""}`,
      {
        cache: "no-store",
      },
    ),
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
  const [messagesHaveMore, setMessagesHaveMore] = useState(false);
  const [olderMessagesLoading, setOlderMessagesLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationCreating, setConversationCreating] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [historyArchived, setHistoryArchived] = useState(false);
  const historyCollapsed = useStoredBoolean(
    HISTORY_COLLAPSED_STORAGE_KEY,
    false,
  );
  const [historyMutatingId, setHistoryMutatingId] = useState<string>();
  const [loadedConversationCount, setLoadedConversationCount] = useState(0);
  const [manualArtifacts, setManualArtifacts] = useState<CanvasArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>();
  const canvasOpenPreference = useStoredBoolean(CANVAS_OPEN_STORAGE_KEY, false);
  const [canvasAutomaticallyOpen, setCanvasAutomaticallyOpen] = useState(false);
  const [canvasManuallyOpen, setCanvasManuallyOpen] = useState(false);
  const canvasPercent = useStoredCanvasPercent();
  const [mobileCanvasOpen, setMobileCanvasOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const latestAutomaticArtifactId = useRef<string | undefined>(undefined);
  const conversationRequestId = useRef(0);

  const refreshConversationList = useCallback(async () => {
    try {
      const page = await fetchConversationPage(0, historyArchived);
      setConversations((current) => {
        const active = current.find(
          (conversation) => conversation.id === activeConversationId,
        );
        return active &&
          Boolean(active.archivedAt) === historyArchived &&
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
  }, [activeConversationId, historyArchived]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AiMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => {
          if (typeof body?.conversationId !== "string") {
            throw new Error("A conversation is required.");
          }
          return {
            body: prepareChatRequest({
              messages,
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
    addToolApprovalResponse,
  } = useChat<AiMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: () => {
      void refreshConversationList();
    },
  });
  const imageUpload = useFileUpload({
    acceptedFileTypes: AI_IMAGE_INPUT_MEDIA_TYPES,
    autoUpload: true,
    disabled:
      !SITE_CONFIG.features.uploads ||
      status === "submitted" ||
      status === "streaming" ||
      conversationLoading ||
      conversationCreating,
    enableImageCompression: true,
    imageCompressionQuality: 0.85,
    imageCompressionMaxHeight: 2048,
    imageCompressionMaxWidth: 2048,
    maxFiles: AI_IMAGE_INPUT_MAX_FILES,
  });
  const imageUploadItems = imageUpload.items;
  const removeImage = imageUpload.removeFile;

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
  const desktopCanvasOpen = shouldOpenDesktopCanvas({
    automaticallyOpen: canvasAutomaticallyOpen,
    hasArtifacts: artifacts.length > 0,
    manuallyOpen: canvasManuallyOpen,
    preferredOpen: canvasOpenPreference,
  });
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const isBusy = status === "submitted" || status === "streaming";
  const historyDisabled =
    historyLoading ||
    isBusy ||
    conversationLoading ||
    conversationCreating ||
    imageUpload.isUploading ||
    historyMutatingId !== undefined;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setHistoryLoading(true);
      try {
        let page = await fetchConversationPage(0, false);
        if (cancelled) return;
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

        const archived = Boolean(detail?.conversation.archivedAt);
        if (archived) {
          page = await fetchConversationPage(0, true);
          if (cancelled) return;
        }

        const nextConversations =
          detail &&
          !page.conversations.some(
            (conversation) => conversation.id === detail?.conversation.id,
          )
            ? [detail.conversation, ...page.conversations]
            : page.conversations;
        setHistoryArchived(archived);
        setLoadedConversationCount(page.conversations.length);
        setHistoryHasMore(page.hasMore);
        setConversations(nextConversations);
        setActiveConversationId(detail?.conversation.id);
        latestAutomaticArtifactId.current = extractArtifacts(
          detail?.messages ?? [],
        ).at(-1)?.id;
        setMessages(detail?.messages ?? []);
        setMessagesHaveMore(detail?.hasMore ?? false);
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
    if (window.matchMedia("(min-width: 80rem)").matches) {
      queueMicrotask(() => setCanvasAutomaticallyOpen(true));
    }
  }, [automaticArtifacts]);

  const clearImageAttachments = useCallback(() => {
    imageUploadItems.forEach((item) => removeImage(item.id));
  }, [imageUploadItems, removeImage]);

  const resetConversationView = useCallback(() => {
    setMessages([]);
    setMessagesHaveMore(false);
    setManualArtifacts([]);
    setActiveArtifactId(undefined);
    setCanvasAutomaticallyOpen(false);
    setCanvasManuallyOpen(false);
    setMobileCanvasOpen(false);
    latestAutomaticArtifactId.current = undefined;
    clearImageAttachments();
    clearError();
  }, [clearError, clearImageAttachments, setMessages]);

  const handleLoadOlderMessages = async () => {
    if (
      !activeConversationId ||
      !messages[0] ||
      historyDisabled ||
      olderMessagesLoading
    )
      return;
    const requestId = conversationRequestId.current;
    setOlderMessagesLoading(true);
    try {
      const detail = await fetchConversation(
        activeConversationId,
        messages[0].id,
      );
      if (requestId !== conversationRequestId.current) return;
      setMessages((current) => [...detail.messages, ...current]);
      setMessagesHaveMore(detail.hasMore ?? false);
    } catch {
      setHistoryError(true);
    } finally {
      setOlderMessagesLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (historyDisabled) return;

    const requestId = ++conversationRequestId.current;
    setConversationLoading(true);
    setHistoryError(false);
    try {
      const detail = await fetchConversation(conversationId);
      if (requestId !== conversationRequestId.current) return;

      resetConversationView();
      latestAutomaticArtifactId.current = extractArtifacts(detail.messages).at(
        -1,
      )?.id;
      setMessages(detail.messages);
      setMessagesHaveMore(detail.hasMore ?? false);
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
    if (historyArchived) void handleToggleArchivedView();
  };

  const handleLoadMore = async () => {
    if (historyLoadingMore || !historyHasMore) return;
    setHistoryLoadingMore(true);
    try {
      const page = await fetchConversationPage(
        loadedConversationCount,
        historyArchived,
      );
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

  const handleToggleArchivedView = async () => {
    if (historyDisabled) return;

    const nextArchived = !historyArchived;
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const page = await fetchConversationPage(0, nextArchived);
      setHistoryArchived(nextArchived);
      setConversations(page.conversations);
      setLoadedConversationCount(page.conversations.length);
      setHistoryHasMore(page.hasMore);
    } catch (viewError) {
      console.error("AI conversation archive could not be loaded:", viewError);
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleArchiveConversation = async (
    conversationId: string,
    archived: boolean,
  ) => {
    if (historyDisabled) return;

    setHistoryMutatingId(conversationId);
    setHistoryError(false);
    try {
      await updateConversationArchive(conversationId, archived);
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId),
      );
      setLoadedConversationCount((current) => Math.max(0, current - 1));

      if (activeConversationId === conversationId) {
        conversationRequestId.current += 1;
        setActiveConversationId(undefined);
        resetConversationView();
        replaceConversationUrl();
      }
    } catch (archiveError) {
      console.error("AI conversation could not be archived:", archiveError);
      setHistoryError(true);
    } finally {
      setHistoryMutatingId(undefined);
    }
  };

  const handleToggleHistoryCollapsed = () => {
    writeStoredValue(HISTORY_COLLAPSED_STORAGE_KEY, String(!historyCollapsed));
  };

  const setPreferredCanvasOpen = (open: boolean) => {
    setCanvasAutomaticallyOpen(false);
    setCanvasManuallyOpen(open);
    writeStoredValue(CANVAS_OPEN_STORAGE_KEY, String(open));
  };

  const openCanvasForCurrentViewport = () => {
    if (window.matchMedia("(min-width: 80rem)").matches) {
      setPreferredCanvasOpen(true);
    } else {
      setMobileCanvasOpen(true);
    }
  };

  const updateCanvasPercent = useCallback((value: number) => {
    const nextCanvasPercent = clampCanvasPercent(value);
    writeStoredValue(CANVAS_PERCENT_STORAGE_KEY, String(nextCanvasPercent));
  }, []);

  const resizeCanvasFromPointer = useCallback(
    (clientX: number) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const rect = workspace.getBoundingClientRect();
      updateCanvasPercent(
        canvasPercentFromPointer(clientX, rect.left, rect.width),
      );
    },
    [updateCanvasPercent],
  );

  const handleCanvasResizePointerDown = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeCanvasFromPointer(event.clientX);
  };

  const handleCanvasResizePointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    resizeCanvasFromPointer(event.clientX);
  };

  const handleCanvasResizePointerEnd = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCanvasResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const change = event.key === "ArrowLeft" ? 2.5 : -2.5;
    updateCanvasPercent(canvasPercent + change);
  };

  const resetCanvasPercent = () => {
    updateCanvasPercent(DEFAULT_CANVAS_PERCENT);
  };

  const handleSubmit = async (suggestedText?: string) => {
    const text = (suggestedText ?? input).trim();
    const readyImages = imageUpload.items.filter(
      (item) => item.status === "success" && item.uploadedFile,
    );
    const hasPendingOrFailedImages = imageUpload.items.some(
      (item) => item.status !== "success",
    );
    if (
      (!text && readyImages.length === 0) ||
      hasPendingOrFailedImages ||
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

    const files: FileUIPart[] = readyImages.map(({ uploadedFile }) => ({
      type: "file",
      mediaType: uploadedFile!.contentType,
      filename: uploadedFile!.fileName,
      url: uploadedFile!.url,
    }));
    const optimisticTitle = titleFromText(
      text || readyImages[0]?.uploadedFile?.fileName || "",
    );
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
    if (text) {
      void sendMessage(
        { text, files },
        { body: { reasoningEffort, conversationId } },
      );
    } else {
      void sendMessage(
        { files },
        { body: { reasoningEffort, conversationId } },
      );
    }
    imageUpload.clearCompleted();
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

  const handleRespondToApproval = (approvalId: string, approved: boolean) => {
    if (!activeConversationId) return;
    // The continuation request is fired by `sendAutomaticallyWhen`, so it needs
    // the same body the transport requires of any other send.
    void addToolApprovalResponse({
      id: approvalId,
      approved,
      options: {
        body: { reasoningEffort, conversationId: activeConversationId },
      },
    });
  };

  const sidebarProps = {
    conversations,
    activeConversationId,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    hasMore: historyHasMore,
    disabled: historyDisabled,
    error: historyError,
    archived: historyArchived,
    mutatingConversationId: historyMutatingId,
    onNew: handleNewConversation,
    onSelect: (conversationId: string) =>
      void handleSelectConversation(conversationId),
    onArchive: (conversationId: string, archived: boolean) =>
      void handleArchiveConversation(conversationId, archived),
    onToggleArchived: () => void handleToggleArchivedView(),
    onLoadMore: () => void handleLoadMore(),
  };

  return (
    <div
      className={cn(
        "grid min-h-0 w-full flex-1 overflow-hidden lg:border-x",
        historyCollapsed
          ? "xl:grid-cols-[3.5rem_minmax(0,1fr)]"
          : "xl:grid-cols-[14rem_minmax(0,1fr)]",
      )}
    >
      <ConversationSidebar
        {...sidebarProps}
        collapsed={historyCollapsed}
        onToggleCollapsed={handleToggleHistoryCollapsed}
        className="hidden border-r xl:flex"
      />

      <div ref={workspaceRef} className="flex min-h-0 min-w-0 overflow-hidden">
        <ChatPanel
          conversationId={activeConversationId}
          messages={messages}
          onLoadOlder={messagesHaveMore ? handleLoadOlderMessages : undefined}
          olderMessagesLoading={olderMessagesLoading}
          input={input}
          status={status}
          error={error}
          reasoningEffort={reasoningEffort}
          canvasCount={artifacts.length}
          canvasOpen={desktopCanvasOpen}
          conversationTitle={activeConversation?.title ?? undefined}
          conversationLoading={
            historyLoading || conversationLoading || conversationCreating
          }
          imageAttachments={imageUpload.items}
          imageUploadsEnabled={SITE_CONFIG.features.uploads}
          imageUploadError={
            Boolean(imageUpload.issue) ||
            imageUpload.items.some((item) => item.status === "error")
          }
          canAddImage={imageUpload.canAddMore && !historyDisabled}
          onAddImages={(files) => void imageUpload.addFiles(files)}
          onRemoveImage={imageUpload.removeFile}
          onRetryImage={(id) => void imageUpload.retryFile(id)}
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
          onRespondToApproval={handleRespondToApproval}
          className="min-w-80 flex-1"
        />

        {desktopCanvasOpen && (
          <>
            <div
              role="separator"
              aria-label={t("ai_canvas_resize")}
              aria-orientation="vertical"
              aria-valuemin={MIN_CANVAS_PERCENT}
              aria-valuemax={MAX_CANVAS_PERCENT}
              aria-valuenow={Math.round(canvasPercent)}
              tabIndex={0}
              title={t("ai_canvas_resize_hint")}
              className="group bg-background focus-visible:ring-ring relative hidden w-2 shrink-0 cursor-col-resize touch-none items-stretch justify-center select-none focus-visible:ring-2 focus-visible:outline-none xl:flex"
              onPointerDown={handleCanvasResizePointerDown}
              onPointerMove={handleCanvasResizePointerMove}
              onPointerUp={handleCanvasResizePointerEnd}
              onPointerCancel={handleCanvasResizePointerEnd}
              onDoubleClick={resetCanvasPercent}
              onKeyDown={handleCanvasResizeKeyDown}
            >
              <span className="bg-border group-hover:bg-primary/50 group-focus-visible:bg-primary/50 w-px transition-colors" />
            </div>
            <div
              className="hidden min-w-80 shrink-0 xl:flex"
              style={{
                width: `clamp(20rem, ${canvasPercent}%, calc(100% - 20.5rem))`,
              }}
            >
              <CanvasPanel
                artifacts={artifacts}
                activeArtifactId={activeArtifactId}
                onSelectArtifact={setActiveArtifactId}
                onClose={() => setPreferredCanvasOpen(false)}
                className="flex h-full w-full"
              />
            </div>
          </>
        )}
      </div>

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm gap-0 p-0 xl:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("ai_history_title")}</SheetTitle>
            <SheetDescription>{t("ai_history_description")}</SheetDescription>
          </SheetHeader>
          <ConversationSidebar
            {...sidebarProps}
            collapsed={false}
            className="flex h-full"
          />
        </SheetContent>
      </Sheet>

      <Sheet open={mobileCanvasOpen} onOpenChange={setMobileCanvasOpen}>
        <SheetContent className="w-full max-w-none gap-0 p-0 sm:max-w-none xl:hidden">
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
