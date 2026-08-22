"use client";

import { History, Loader2, MessageSquare, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AiConversationSummary } from "@/lib/ai/chat-history-types";
import { useTranslation } from "@/lib/i18n/translation/client";
import { resolveIntlLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: AiConversationSummary[];
  activeConversationId?: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  disabled: boolean;
  error: boolean;
  className?: string;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onLoadMore: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  loading,
  loadingMore,
  hasMore,
  disabled,
  error,
  className,
  onNew,
  onSelect,
  onLoadMore,
}: ConversationSidebarProps) {
  const { t } = useTranslation();
  const intlLocale = resolveIntlLocale(useLocale());
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
  });

  return (
    <aside className={cn("bg-muted/20 min-h-0 flex-col", className)}>
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <History className="text-muted-foreground size-4" />
        <h2 className="flex-1 text-sm font-medium">{t("ai_history_title")}</h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={onNew}
          disabled={disabled}
          aria-label={t("ai_history_new")}
        >
          <Plus />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t("ai_history_loading")}
          </div>
        ) : error && conversations.length === 0 ? (
          <p className="text-destructive px-2 py-6 text-center text-sm">
            {t("ai_history_error")}
          </p>
        ) : conversations.length === 0 ? (
          <div className="text-muted-foreground px-3 py-8 text-center text-sm">
            <MessageSquare className="mx-auto mb-3 size-5" />
            {t("ai_history_empty")}
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                disabled={disabled}
                className={cn(
                  "hover:bg-muted focus-visible:ring-ring/50 flex w-full items-start gap-2 px-2.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                  activeConversationId === conversation.id && "bg-muted",
                )}
              >
                <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {conversation.title ?? t("ai_history_untitled")}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {dateFormatter.format(new Date(conversation.updatedAt))}
                  </span>
                </span>
              </button>
            ))}

            {hasMore && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={onLoadMore}
                disabled={loadingMore || disabled}
              >
                {loadingMore && <Loader2 className="animate-spin" />}
                {t("ai_history_load_more")}
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
