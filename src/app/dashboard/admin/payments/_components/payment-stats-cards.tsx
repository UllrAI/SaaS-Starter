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
        title={t("admin_settled_usd_revenue")}
        value={formatCurrency(stats.totalRevenue)}
        description={t("admin_settled_usd_revenue_description")}
        icon={DollarSign}
        locale={locale}
      />
      <StatCard
        title={t("admin_total_payments")}
        value={stats.total}
        description={t("admin_all_time_payment_transactions")}
        icon={CreditCard}
        locale={locale}
      />
      <StatCard
        title={t("admin_successful_payments")}
        value={stats.successful}
        description={t("admin_completed_transactions")}
        icon={TrendingUp}
        locale={locale}
      />
      <StatCard
        title={t("admin_non_settled_payments")}
        value={nonSettledPayments}
        description={t("admin_non_settled_payments_description")}
        icon={AlertTriangle}
        locale={locale}
      />
    </div>
  );
}
