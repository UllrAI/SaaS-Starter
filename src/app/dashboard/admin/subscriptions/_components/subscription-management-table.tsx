"use client";

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
    queryAction: querySubscriptions, // Use the wrapped function
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

      // FIX: Correctly handle next-safe-action result
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
      past_due: "destructive",
      incomplete: "destructive",
      unpaid: "destructive",
    };
    return variants[status] || "secondary";
  };

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns: Array<{
    key: keyof SubscriptionWithUser | string;
    label: string;
    render?: (item: SubscriptionWithUser) => ReactNode;
  }> = [
    {
      key: "user",
      label: "User",
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
      label: "Plan",
      render: (sub) => <div className="font-medium">{sub.planName}</div>,
    },
    {
      key: "status",
      label: "Status",
      render: (sub) => (
        <Badge
          variant={getStatusBadgeVariant(sub.status)}
          className="capitalize"
        >
          {sub.status}
        </Badge>
      ),
    },
    {
      key: "period",
      label: "Current Period",
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
      label: "Actions",
      render: (sub) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCancelClick(sub)}
          disabled={sub.status === "canceled" || isPending}
        >
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      ),
    },
  ];

  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "trialing", label: "Trialing" },
    { value: "canceled", label: "Canceled" },
    { value: "past_due", label: "Past Due" },
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
        searchPlaceholder="Search by user name, email, or subscription ID..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilter}
        filterOptions={statusFilterOptions}
        filterPlaceholder="Filter by status"
        pagination={pagination}
        onPageChange={handlePageChange}
        emptyMessage="No subscriptions found"
      />
      <Dialog
        open={!!cancellingSubscription}
        onOpenChange={(isOpen) => !isOpen && setCancellingSubscription(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the subscription for{" "}
              <strong>{cancellingSubscription?.user?.name}</strong>? This action
              is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancellingSubscription(null)}
              disabled={isPending}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
