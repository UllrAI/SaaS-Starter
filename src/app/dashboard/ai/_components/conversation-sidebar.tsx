"use client";

import {
  Archive,
  ArchiveRestore,
  History,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
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
  archived: boolean;
  collapsed?: boolean;
  mutatingConversationId?: string;
  className?: string;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onArchive: (conversationId: string, archived: boolean) => void;
  onToggleArchived: () => void;
  onToggleCollapsed?: () => void;
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
  archived,
  collapsed = false,
  mutatingConversationId,
  className,
  onNew,
  onSelect,
  onArchive,
  onToggleArchived,
  onToggleCollapsed,
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
      <div
        className={cn(
          "flex items-center gap-1 border-b px-2 py-2",
          collapsed && "flex-col",
        )}
      >
        {!collapsed && (
          <>
            {archived ? (
              <Archive className="text-muted-foreground ml-1 size-4" />
            ) : (
              <History className="text-muted-foreground ml-1 size-4" />
            )}
            <h2 className="min-w-0 flex-1 truncate px-1 text-sm font-medium">
              {archived
                ? t("ai_history_archived_title")
                : t("ai_history_title")}
            </h2>
          </>
        )}
        {onToggleCollapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onToggleCollapsed}
            aria-label={
              collapsed ? t("ai_history_expand") : t("ai_history_collapse")
            }
            title={
              collapsed ? t("ai_history_expand") : t("ai_history_collapse")
            }
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        )}
        <Button
          type="button"
          variant={collapsed ? "ghost" : "outline"}
          size="icon"
          className="size-8"
          onClick={onNew}
          disabled={disabled}
          aria-label={t("ai_history_new")}
        >
          <Plus />
        </Button>
      </div>

      <div className={cn("border-b p-2", collapsed && "flex justify-center")}>
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(collapsed ? "size-8" : "w-full justify-start")}
          onClick={onToggleArchived}
          disabled={disabled}
          aria-label={
            archived
              ? t("ai_history_show_active")
              : t("ai_history_show_archived")
          }
          title={
            archived
              ? t("ai_history_show_active")
              : t("ai_history_show_archived")
          }
        >
          {archived ? <History /> : <Archive />}
          {!collapsed &&
            (archived
              ? t("ai_history_show_active")
              : t("ai_history_show_archived"))}
        </Button>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {error && conversations.length > 0 && (
            <p className="text-destructive px-2 py-2 text-center text-xs">
              {t("ai_history_error")}
            </p>
          )}
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
              {archived ? (
                <Archive className="mx-auto mb-3 size-5" />
              ) : (
                <MessageSquare className="mx-auto mb-3 size-5" />
              )}
              {archived
                ? t("ai_history_archived_empty")
                : t("ai_history_empty")}
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "hover:bg-muted group flex w-full items-start transition-colors",
                    activeConversationId === conversation.id && "bg-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    disabled={disabled}
                    className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2.5 text-left focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1.5 mr-1 size-7 shrink-0 opacity-70 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => onArchive(conversation.id, !archived)}
                    disabled={
                      disabled || mutatingConversationId === conversation.id
                    }
                    aria-label={
                      archived
                        ? t("ai_history_restore")
                        : t("ai_history_archive")
                    }
                    title={
                      archived
                        ? t("ai_history_restore")
                        : t("ai_history_archive")
                    }
                  >
                    {mutatingConversationId === conversation.id ? (
                      <Loader2 className="animate-spin" />
                    ) : archived ? (
                      <ArchiveRestore />
                    ) : (
                      <Archive />
                    )}
                  </Button>
                </div>
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
      )}
    </aside>
  );
}
