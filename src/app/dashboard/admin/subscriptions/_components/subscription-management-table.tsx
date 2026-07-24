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
} from "@/lib/actions/admin";
import { SubscriptionStatus } from "@/types/billing";
import { useIntlLocale } from "@/hooks/use-intl-locale";
interface SubscriptionManagementTableProps {
  initialData: SubscriptionWithUser[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
function SubscriptionStatusLabel({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case "active":
      return <>{t("2c465f05d500", "Active")}</>;
    case "trialing":
      return <>{t("c3edc911fa1d", "Trialing")}</>;
    case "canceled":
      return <>{t("814b0f3e70ac", "Canceled")}</>;
    case "expired":
      return <>{t("subscription_status_expired", "Expired")}</>;
    case "paused":
      return <>{t("subscription_status_paused", "Paused")}</>;
    case "scheduled_cancel":
      return (
        <>{t("subscription_status_scheduled_cancel", "Scheduled to cancel")}</>
      );
    case "past_due":
      return <>{t("64f180e9fb46", "Past Due")}</>;
    case "incomplete":
      return <>{t("4704260a99f1", "Incomplete")}</>;
    case "unpaid":
      return <>{t("685a7728149e", "Unpaid")}</>;
    default:
      return <>{t("7ffb1c89fbde", "Unknown")}</>;
  }
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
        toast.success(result.data.message);
        setCancellingSubscription(null);
        refresh();
      } else if (result.serverError) {
        toast.error(result.serverError);
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
    if (!dateString) return "N/A";
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
      label: <>{t("2fd5139478b6", "User")}</>,
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
      label: <>{t("26c0caae43e2", "Plan")}</>,
      render: (sub) => <div className="font-medium">{sub.planName}</div>,
    },
    {
      key: "status",
      label: <>{t("9b86c85c7bea", "Status")}</>,
      render: (sub) => (
        <Badge
          variant={getStatusBadgeVariant(sub.status)}
          className="capitalize"
        >
          <SubscriptionStatusLabel status={sub.status} />
        </Badge>
      ),
    },
    {
      key: "period",
      label: <>{t("075acad5a68c", "Current Period")}</>,
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
      label: <>{t("37af94806549", "Actions")}</>,
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
      label: <>{t("635fd8dd282f", "All Statuses")}</>,
    },
    {
      value: "active",
      label: <>{t("a91043bb2ef9", "Active")}</>,
    },
    {
      value: "trialing",
      label: <>{t("8c6eb5ed9f62", "Trialing")}</>,
    },
    {
      value: "canceled",
      label: <>{t("c9f42d0e6f6f", "Canceled")}</>,
    },
    {
      value: "past_due",
      label: <>{t("493ace466900", "Past Due")}</>,
    },
    {
      value: "scheduled_cancel",
      label: (
        <>{t("subscription_status_scheduled_cancel", "Scheduled to cancel")}</>
      ),
    },
    {
      value: "paused",
      label: <>{t("subscription_status_paused", "Paused")}</>,
    },
    {
      value: "expired",
      label: <>{t("subscription_status_expired", "Expired")}</>,
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
              "95762e04faa9",
              "Search by user name, email, or subscription ID...",
            )}
          </>
        }
        filterValue={statusFilter}
        onFilterChange={handleStatusFilter}
        filterOptions={statusFilterOptions}
        filterPlaceholder={<>{t("a16185256691", "Filter by status")}</>}
        pagination={pagination}
        onPageChange={handlePageChange}
        emptyMessage={<>{t("bfa63c6ce393", "No subscriptions found")}</>}
      />
      <Dialog
        open={!!cancellingSubscription}
        onOpenChange={(isOpen) => !isOpen && setCancellingSubscription(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("4f1689f83c9f", "Cancel Subscription")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "d6873b62f007",
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
              {t("be6fb3171b20", "Back")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              disabled={isPending}
            >
              {t("063b2e3c90d9", "{expression0} Confirm Cancellation", {
                expression0: isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ),
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
