import { getServerTranslations } from "@/lib/i18n/translation/server";
import { StatCard } from "@/components/admin/StatCard";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { getPaymentStats } from "@/lib/admin/stats";
import { getRequestIntlLocale } from "@/lib/i18n/server-locale";
export async function PaymentStatsCards() {
  const { t } = await getServerTranslations();
  const [locale, stats] = await Promise.all([
    getRequestIntlLocale(),
    getPaymentStats(),
  ]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };
  const nonSettledPayments = stats.total - stats.successful;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("admin_settled_usd_revenue", "Settled USD Revenue")}
        value={formatCurrency(stats.totalRevenue)}
        description={t(
          "admin_settled_usd_revenue_description",
          "All-time succeeded payments in USD",
        )}
        icon={DollarSign}
        locale={locale}
      />
      <StatCard
        title={t("dcf3044f6d5a", "Total Payments")}
        value={stats.total}
        description={t("49a1f144a83d", "All-time payment transactions")}
        icon={CreditCard}
        locale={locale}
      />
      <StatCard
        title={t("6bb4a14cf9ec", "Successful Payments")}
        value={stats.successful}
        description={t("1ff3b41295ff", "Completed transactions")}
        icon={TrendingUp}
        locale={locale}
      />
      <StatCard
        title={t("admin_non_settled_payments", "Non-settled Payments")}
        value={nonSettledPayments}
        description={t(
          "admin_non_settled_payments_description",
          "Pending, refunded, disputed, or failed transactions",
        )}
        icon={AlertTriangle}
        locale={locale}
      />
    </div>
  );
}
