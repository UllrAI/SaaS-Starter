"use client";

import { ReactNode, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import { PaymentWithUser } from "@/types/billing";
import { useAdminTable } from "@/hooks/use-admin-table";
import { Button } from "@/components/ui/button";
import { getPayments } from "@/lib/actions/admin";

interface PaymentManagementTableProps {
  initialData: PaymentWithUser[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "succeeded":
      return "secondary";
    case "pending":
      return "outline";
    case "failed":
      return "destructive";
    case "canceled":
      return "outline";
    default:
      return "secondary";
  }
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const openProviderPayment = (paymentId: string) => {
  window.open(`https://www.creem.io/dashboard/payments/${paymentId}`, "_blank");
};

const getPaymentMethodLabel = (paymentType: string) => {
  const map: Record<string, string> = {
    subscription: "Subscription",
    one_time: "One-time Payment",
    card: "Credit Card",
    bank_transfer: "Bank Transfer",
    paypal: "PayPal",
  };
  return map[paymentType] || "Unknown";
};

const columns: Array<{
  key: keyof PaymentWithUser | string;
  label: string;
  render?: (item: PaymentWithUser) => ReactNode;
}> = [
  {
    key: "user",
    label: "User",
    render: (payment) => (
      <UserAvatarCell
        name={payment.user?.name}
        email={payment.user?.email}
        image={payment.user?.image}
      />
    ),
  },
  {
    key: "amount",
    label: "Amount",
    render: (payment) => (
      <div className="font-medium">
        {formatCurrency(payment.amount, payment.currency)}
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (payment) => (
      <Badge
        variant={getStatusBadgeVariant(payment.status)}
        className="capitalize"
      >
        {payment.status}
      </Badge>
    ),
  },
  {
    key: "method",
    label: "Method",
    render: (payment) => (
      <div className="text-sm">
        {getPaymentMethodLabel(payment.paymentType)}
      </div>
    ),
  },
  {
    key: "created",
    label: "Created",
    render: (payment) => formatDate(payment.createdAt),
  },
  {
    key: "actions",
    label: "Actions",
    render: (payment) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openProviderPayment(payment.paymentId)}
        title="View in Creem Dashboard"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    ),
  },
];

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "succeeded", label: "Succeeded" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "canceled", label: "Canceled" },
];

export function PaymentManagementTable({
  initialData,
  initialPagination,
}: PaymentManagementTableProps) {
  // FIX: Wrap queryAction with useCallback
  const queryPayments = useCallback(
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
      getPayments({
        page,
        limit,
        search,
        status: filter as
          | "succeeded"
          | "failed"
          | "pending"
          | "canceled"
          | "all",
      }),
    [],
  );

  const {
    data: payments,
    loading,
    error,
    pagination,
    searchTerm,
    filter: statusFilter,
    setSearchTerm: handleSearch,
    setFilter: handleStatusFilter,
    setCurrentPage: handlePageChange,
  } = useAdminTable<PaymentWithUser>({
    queryAction: queryPayments, // Use the wrapped function
    initialData,
    initialPagination,
  });

  return (
    <AdminTableBase<PaymentWithUser>
      data={payments}
      columns={columns}
      loading={loading}
      error={error}
      searchTerm={searchTerm}
      onSearchChange={handleSearch}
      searchPlaceholder="Search by user name, email, or payment ID..."
      filterValue={statusFilter}
      onFilterChange={handleStatusFilter}
      filterOptions={statusFilterOptions}
      filterPlaceholder="Filter by status"
      pagination={pagination}
      onPageChange={handlePageChange}
      emptyMessage="No payments found"
    />
  );
}
