"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useState, ReactNode, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import type { SubscriptionWithUser } from "@/types/billing";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
  getSubscriptions,
  cancelSubscriptionAction,
} from "@/lib/actions/admin/subscriptions";
import { SubscriptionStatus } from "@/types/billing";
import { useIntlLocale } from "@/hooks/use-intl-locale";
import { getSubscriptionStatusLabel } from "@/lib/billing/labels";
interface SubscriptionManagementTableProps {
  initialData: SubscriptionWithUser[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export function SubscriptionManagementTable({
  initialData,
  initialPagination,
}: SubscriptionManagementTableProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPending, startTransition] = useTransition();
  const [cancellingSubscription, setCancellingSubscription] =
    useState<SubscriptionWithUser | null>(null);
  const querySubscriptions = useCallback(
    async ({
      page,
      limit,
      search,
      filter,
    }: {
      page: number;
      limit: number;
      search?: string;
      filter?: string;
    }) =>
      getSubscriptions({
        page,
        limit,
        search,
        status: filter as SubscriptionStatus | "all",
      }),
    [],
  );
  const {
    data: subscriptions,
    loading,
    error,
    pagination,
    searchTerm,
    filter: statusFilter,
    setSearchTerm: handleSearch,
    setFilter: handleStatusFilter,
    setCurrentPage: handlePageChange,
    refresh,
  } = useAdminTable<SubscriptionWithUser>({
    queryAction: querySubscriptions,
    // Use the wrapped function
    initialData,
    initialPagination,
  });
  const handleCancelClick = (subscription: SubscriptionWithUser) => {
    setCancellingSubscription(subscription);
  };
  const confirmCancelSubscription = async () => {
    if (!cancellingSubscription) return;
    startTransition(async () => {
      const result = await cancelSubscriptionAction({
        subscriptionId: cancellingSubscription.subscriptionId,
      });

      if (result.data) {
        toast.success(
          t(
            "subscription_cancel_success",
            "The subscription has been canceled.",
          ),
        );
        setCancellingSubscription(null);
        refresh();
      } else if (result.serverError) {
        toast.error(
          t(
            "subscription_cancel_error",
            "We couldn't cancel the subscription. Please try again.",
          ),
        );
      }
    });
  };
  const getStatusBadgeVariant = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      active: "default",
      trialing: "secondary",
      canceled: "outline",
      expired: "outline",
      paused: "secondary",
      scheduled_cancel: "secondary",
      past_due: "destructive",
      incomplete: "destructive",
      unpaid: "destructive",
    };
    return variants[status] || "secondary";
  };
  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return t("common_not_available", "Not available");
    return new Date(dateString).toLocaleDateString(intlLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const columns: Array<{
    key: keyof SubscriptionWithUser | string;
    label: ReactNode;
    render?: (item: SubscriptionWithUser) => ReactNode;
  }> = [
    {
      key: "user",
      label: <>{t("admin_user", "User")}</>,
      render: (sub) => (
        <UserAvatarCell
          name={sub.user?.name}
          email={sub.user?.email}
          image={sub.user?.image}
        />
      ),
    },
    {
      key: "plan",
      label: <>{t("admin_plan", "Plan")}</>,
      render: (sub) => <div className="font-medium">{sub.planName}</div>,
    },
    {
      key: "status",
      label: <>{t("admin_status", "Status")}</>,
      render: (sub) => (
        <Badge
          variant={getStatusBadgeVariant(sub.status)}
          className="capitalize"
        >
          {getSubscriptionStatusLabel(sub.status, t)}
        </Badge>
      ),
    },
    {
      key: "period",
      label: <>{t("admin_current_period", "Current Period")}</>,
      render: (sub) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDate(sub.currentPeriodStart)} -{" "}
            {formatDate(sub.currentPeriodEnd)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: <>{t("admin_actions", "Actions")}</>,
      render: (sub) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCancelClick(sub)}
          disabled={!["active", "trialing"].includes(sub.status) || isPending}
        >
          <X className="mr-1 h-4 w-4" />
          {t("subscription_action_cancel", "Cancel")}
        </Button>
      ),
    },
  ];
  const statusFilterOptions = [
    {
      value: "all",
      label: <>{t("admin_all_statuses", "All Statuses")}</>,
    },
    {
      value: "active",
      label: <>{getSubscriptionStatusLabel("active", t)}</>,
    },
    {
      value: "trialing",
      label: <>{getSubscriptionStatusLabel("trialing", t)}</>,
    },
    {
      value: "canceled",
      label: <>{getSubscriptionStatusLabel("canceled", t)}</>,
    },
    {
      value: "past_due",
      label: <>{getSubscriptionStatusLabel("past_due", t)}</>,
    },
    {
      value: "scheduled_cancel",
      label: <>{getSubscriptionStatusLabel("scheduled_cancel", t)}</>,
    },
    {
      value: "paused",
      label: <>{getSubscriptionStatusLabel("paused", t)}</>,
    },
    {
      value: "expired",
      label: <>{getSubscriptionStatusLabel("expired", t)}</>,
    },
  ];
  return (
    <>
      <AdminTableBase<SubscriptionWithUser>
        data={subscriptions}
        columns={columns}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder={
          <>
            {t(
              "admin_search_user_name_email_subscription_id",
              "Search by user name, email, or subscription ID...",
            )}
          </>
        }
        filterValue={statusFilter}
        onFilterChange={handleStatusFilter}
        filterOptions={statusFilterOptions}
        filterPlaceholder={<>{t("admin_filter_status", "Filter by status")}</>}
        pagination={pagination}
        onPageChange={handlePageChange}
        emptyMessage={
          <>{t("admin_no_subscriptions_found", "No subscriptions found")}</>
        }
      />
      <Dialog
        open={!!cancellingSubscription}
        onOpenChange={(isOpen) => !isOpen && setCancellingSubscription(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin_cancel_subscription", "Cancel Subscription")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "admin_you_sure_want_cancel_subscription_action",
                "Are you sure you want to cancel the subscription for <strong0>{expression0}</strong0>? This action is irreversible.",
                {
                  expression0:
                    cancellingSubscription?.user.name ??
                    cancellingSubscription?.user.email ??
                    cancellingSubscription?.subscriptionId ??
                    "",
                  strong0: (chunks) => <strong>{chunks}</strong>,
                },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancellingSubscription(null)}
              disabled={isPending}
            >
              {t("admin_back", "Back")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              disabled={isPending}
            >
              {t(
                "admin_confirm_cancellation",
                "{expression0} Confirm Cancellation",
                {
                  expression0: isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ),
                },
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
