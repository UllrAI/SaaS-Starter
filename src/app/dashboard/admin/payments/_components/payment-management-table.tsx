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
import { defineCopyCatalog } from "@/lib/i18n/copy-catalog";

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
const STATUS_BADGE_VARIANT_MAP: Record<string, BadgeVariant> = {
  succeeded: "secondary",
  pending: "outline",
  failed: "destructive",
  canceled: "outline",
};

const getStatusBadgeVariant = (status: string) => {
  return STATUS_BADGE_VARIANT_MAP[status] ?? "secondary";
};

const PAYMENT_STATUS_COPY = defineCopyCatalog([
  {
    id: "succeeded",
    Label: function PaymentStatusSucceededLabel() {
      return <>Succeeded</>;
    },
  },
  {
    id: "pending",
    Label: function PaymentStatusPendingLabel() {
      return <>Pending</>;
    },
  },
  {
    id: "failed",
    Label: function PaymentStatusFailedLabel() {
      return <>Failed</>;
    },
  },
  {
    id: "canceled",
    Label: function PaymentStatusCanceledLabel() {
      return <>Canceled</>;
    },
  },
  {
    id: "unknown",
    Label: function PaymentStatusUnknownLabel() {
      return <>Unknown</>;
    },
  },
] satisfies ReadonlyArray<{
  id: string;
  Label: React.ComponentType;
}>);

const PAYMENT_METHOD_COPY = defineCopyCatalog([
  {
    id: "subscription",
    Label: function PaymentMethodSubscriptionLabel() {
      return <>Subscription</>;
    },
  },
  {
    id: "one_time",
    Label: function PaymentMethodOneTimeLabel() {
      return <>One-time Payment</>;
    },
  },
  {
    id: "card",
    Label: function PaymentMethodCardLabel() {
      return <>Credit Card</>;
    },
  },
  {
    id: "bank_transfer",
    Label: function PaymentMethodBankTransferLabel() {
      return <>Bank Transfer</>;
    },
  },
  {
    id: "paypal",
    Label: function PaymentMethodPayPalLabel() {
      return <>PayPal</>;
    },
  },
  {
    id: "unknown",
    Label: function PaymentMethodUnknownLabel() {
      return <>Unknown</>;
    },
  },
] satisfies ReadonlyArray<{
  id: string;
  Label: React.ComponentType;
}>);

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
      const PaymentStatusLabel = (
        PAYMENT_STATUS_COPY.entries.find((entry) => entry.id === payment.status) ??
        PAYMENT_STATUS_COPY.get("unknown")
      ).Label;

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
      const PaymentMethodLabel = (
        PAYMENT_METHOD_COPY.entries.find(
          (entry) => entry.id === payment.paymentType,
        ) ?? PAYMENT_METHOD_COPY.get("unknown")
      ).Label;

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
