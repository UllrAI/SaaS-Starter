"use client";

import { type ComponentProps, type ReactNode, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import { PaymentWithUser } from "@/types/billing";
import { useAdminTable } from "@/hooks/use-admin-table";
import { Button } from "@/components/ui/button";
import { getPayments } from "@/lib/actions/admin";
import { useIntlLocale } from "@/hooks/use-intl-locale";

interface PaymentManagementTableProps {
  initialData: PaymentWithUser[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type BadgeVariant = ComponentProps<typeof Badge>["variant"];
type CopyComponent = React.ComponentType;

const STATUS_BADGE_VARIANT_MAP: Record<string, BadgeVariant> = {
  succeeded: "secondary",
  pending: "outline",
  failed: "destructive",
  canceled: "outline",
};

const getStatusBadgeVariant = (status: string) => {
  return STATUS_BADGE_VARIANT_MAP[status] ?? "secondary";
};

const PAYMENT_STATUS_LABELS: Record<string, CopyComponent> = {
  succeeded: function PaymentStatusSucceededLabel() {
    return <>Succeeded</>;
  },
  pending: function PaymentStatusPendingLabel() {
    return <>Pending</>;
  },
  failed: function PaymentStatusFailedLabel() {
    return <>Failed</>;
  },
  canceled: function PaymentStatusCanceledLabel() {
    return <>Canceled</>;
  },
};

const PAYMENT_METHOD_LABELS: Record<string, CopyComponent> = {
  subscription: function PaymentMethodSubscriptionLabel() {
    return <>Subscription</>;
  },
  one_time: function PaymentMethodOneTimeLabel() {
    return <>One-time Payment</>;
  },
  card: function PaymentMethodCardLabel() {
    return <>Credit Card</>;
  },
  bank_transfer: function PaymentMethodBankTransferLabel() {
    return <>Bank Transfer</>;
  },
  paypal: function PaymentMethodPayPalLabel() {
    return <>PayPal</>;
  },
};

const formatCurrency = (amount: number, currency: string, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (dateString: string | Date, locale: string) => {
  return new Date(dateString).toLocaleDateString(locale, {
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

const createColumns = (
  locale: string,
): Array<{
  key: keyof PaymentWithUser | string;
  label: ReactNode;
  render?: (item: PaymentWithUser) => ReactNode;
}> => [
  {
    key: "user",
    label: <>User</>,
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
    label: <>Amount</>,
    render: (payment) => (
      <div className="font-medium">
        {formatCurrency(payment.amount, payment.currency, locale)}
      </div>
    ),
  },
  {
    key: "status",
    label: <>Status</>,
    render: (payment) => {
      const PaymentStatusLabel =
        PAYMENT_STATUS_LABELS[payment.status] ??
        function PaymentStatusFallbackLabel() {
          return <>Unknown</>;
        };

      return (
        <Badge
          variant={getStatusBadgeVariant(payment.status)}
          className="capitalize"
        >
          <PaymentStatusLabel />
        </Badge>
      );
    },
  },
  {
    key: "method",
    label: <>Method</>,
    render: (payment) => {
      const PaymentMethodLabel =
        PAYMENT_METHOD_LABELS[payment.paymentType] ??
        function PaymentMethodFallbackLabel() {
          return <>Unknown</>;
        };

      return (
        <div className="text-sm">
          <PaymentMethodLabel />
        </div>
      );
    },
  },
  {
    key: "created",
    label: <>Created</>,
    render: (payment) => formatDate(payment.createdAt, locale),
  },
  {
    key: "actions",
    label: <>Actions</>,
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
  { value: "all", label: <>All Statuses</> },
  { value: "succeeded", label: <>Succeeded</> },
  { value: "pending", label: <>Pending</> },
  { value: "failed", label: <>Failed</> },
  { value: "canceled", label: <>Canceled</> },
];

export function PaymentManagementTable({
  initialData,
  initialPagination,
}: PaymentManagementTableProps) {
  const intlLocale = useIntlLocale();
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

  const columns = createColumns(intlLocale);

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
