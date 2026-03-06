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
  const failedPayments = stats.total - stats.successful;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        description="All-time revenue"
        icon={DollarSign}
        locale={locale}
      />
      <StatCard
        title="Total Payments"
        value={stats.total}
        description="All-time payment transactions"
        icon={CreditCard}
        locale={locale}
      />
      <StatCard
        title="Successful Payments"
        value={stats.successful}
        description="Completed transactions"
        icon={TrendingUp}
        locale={locale}
      />
      <StatCard
        title="Failed Payments"
        value={failedPayments}
        description="Transactions that did not complete"
        icon={AlertTriangle}
        locale={locale}
      />
    </div>
  );
}
