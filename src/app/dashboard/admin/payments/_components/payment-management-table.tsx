"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { type ComponentProps, type ReactNode, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import { PaymentWithUser } from "@/types/billing";
import { useAdminTable } from "@/hooks/use-admin-table";
import { getPayments } from "@/lib/actions/admin/payments";
import { useIntlLocale } from "@/hooks/use-intl-locale";
import type { AppTranslate } from "@/lib/i18n/translation/shared";
import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
} from "@/lib/billing/labels";
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
const createColumns = (
  locale: string,
  t: AppTranslate,
): Array<{
  key: keyof PaymentWithUser | string;
  label: ReactNode;
  render?: (item: PaymentWithUser) => ReactNode;
}> => [
  {
    key: "user",
    label: <>{t("admin_payment_column_user", "User")}</>,
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
    label: <>{t("admin_payment_column_amount", "Amount")}</>,
    render: (payment) => (
      <div className="font-medium">
        {formatCurrency(payment.amount, payment.currency, locale)}
      </div>
    ),
  },
  {
    key: "status",
    label: <>{t("admin_payment_column_status", "Status")}</>,
    render: (payment) => (
      <Badge
        variant={getStatusBadgeVariant(payment.status)}
        className="capitalize"
      >
        {getPaymentStatusLabel(payment.status, t)}
      </Badge>
    ),
  },
  {
    key: "method",
    label: <>{t("admin_payment_column_method", "Method")}</>,
    render: (payment) => (
      <div className="text-sm">
        {getPaymentTypeLabel(payment.paymentType, t)}
      </div>
    ),
  },
  {
    key: "created",
    label: <>{t("admin_payment_column_created", "Created")}</>,
    render: (payment) => formatDate(payment.createdAt, locale),
  },
];
export function PaymentManagementTable({
  initialData,
  initialPagination,
}: PaymentManagementTableProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
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
    queryAction: queryPayments,
    initialData,
    initialPagination,
  });
  const columns = createColumns(intlLocale, t);
  const statusFilterOptions = [
    {
      value: "all",
      label: <>{t("admin_payment_filter_all_statuses", "All statuses")}</>,
    },
    {
      value: "succeeded",
      label: <>{getPaymentStatusLabel("succeeded", t)}</>,
    },
    {
      value: "pending",
      label: <>{getPaymentStatusLabel("pending", t)}</>,
    },
    {
      value: "failed",
      label: <>{getPaymentStatusLabel("failed", t)}</>,
    },
    {
      value: "canceled",
      label: <>{getPaymentStatusLabel("canceled", t)}</>,
    },
  ];
  return (
    <AdminTableBase<PaymentWithUser>
      data={payments}
      columns={columns}
      loading={loading}
      error={error}
      searchTerm={searchTerm}
      onSearchChange={handleSearch}
      searchPlaceholder={
        <>{t("989cf2a31a4f", "Search by user name, email, or payment ID...")}</>
      }
      filterValue={statusFilter}
      onFilterChange={handleStatusFilter}
      filterOptions={statusFilterOptions}
      filterPlaceholder={<>{t("0959bb05ac4b", "Filter by status")}</>}
      pagination={pagination}
      onPageChange={handlePageChange}
      emptyMessage={<>{t("872b4e8bd590", "No payments found")}</>}
    />
  );
}
