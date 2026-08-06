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
  t: (key: string) => string,
): Array<{
  key: keyof PaymentWithUser | string;
  label: ReactNode;
  render?: (item: PaymentWithUser) => ReactNode;
}> => [
  {
    key: "user",
    label: <>{t("admin_payment_column_user")}</>,
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
    label: <>{t("admin_payment_column_amount")}</>,
    render: (payment) => (
      <div className="font-medium">
        {formatCurrency(payment.amount, payment.currency, locale)}
      </div>
    ),
  },
  {
    key: "status",
    label: <>{t("admin_payment_column_status")}</>,
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
    label: <>{t("admin_payment_column_method")}</>,
    render: (payment) => (
      <div className="text-sm">
        {getPaymentTypeLabel(payment.paymentType, t)}
      </div>
    ),
  },
  {
    key: "created",
    label: <>{t("admin_payment_column_created")}</>,
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
      label: <>{t("admin_payment_filter_all_statuses")}</>,
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
      searchPlaceholder={<>{t("admin_search_user_name_email_payment_id")}</>}
      filterValue={statusFilter}
      onFilterChange={handleStatusFilter}
      filterOptions={statusFilterOptions}
      filterPlaceholder={<>{t("admin_filter_status")}</>}
      pagination={pagination}
      onPageChange={handlePageChange}
      emptyMessage={<>{t("admin_no_payments_found")}</>}
    />
  );
}
