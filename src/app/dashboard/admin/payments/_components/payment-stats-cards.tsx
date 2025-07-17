import { StatCard } from "@/components/admin/StatCard";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { getPaymentStats } from "@/lib/admin/stats";
import type { AdminStats } from "../../_components/admin-stats-cards";

export async function PaymentStatsCards() {
  const stats: AdminStats["payments"] = await getPaymentStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
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
      />
      <StatCard
        title="Total Payments"
        value={stats.total}
        description="All-time payment transactions"
        icon={CreditCard}
      />
      <StatCard
        title="Successful Payments"
        value={stats.successful}
        description="Completed transactions"
        icon={TrendingUp}
      />
      <StatCard
        title="Failed Payments"
        value={failedPayments}
        description="Transactions that did not complete"
        icon={AlertTriangle}
      />
    </div>
  );
}
