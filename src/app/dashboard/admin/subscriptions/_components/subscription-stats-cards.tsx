import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { getSubscriptionStats } from "@/lib/admin/stats";
import { getServerLocale } from "@lingo.dev/compiler/virtual/locale/server";

export async function SubscriptionStatsCards() {
  const [locale, stats] = await Promise.all([
    getServerLocale(),
    getSubscriptionStats(),
  ]);

  // MRR calculation is complex and often requires historical data.
  // We'll keep it as a placeholder for now as per the original implementation.
  const monthlyRecurringRevenue = "$0";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Subscriptions"
        value={stats.total}
        description="All-time subscriptions"
        icon={Users}
        locale={locale}
      />
      <StatCard
        title="Active Subscriptions"
        value={stats.active}
        description="Currently active plans"
        icon={UserCheck}
        locale={locale}
      />
      <StatCard
        title="Canceled Subscriptions"
        value={stats.canceled}
        description="Subscriptions marked for cancellation"
        icon={UserX}
        locale={locale}
      />
      <StatCard
        title="MRR (Placeholder)"
        value={monthlyRecurringRevenue}
        description="Monthly Recurring Revenue"
        icon={TrendingUp}
        locale={locale}
      />
    </div>
  );
}
