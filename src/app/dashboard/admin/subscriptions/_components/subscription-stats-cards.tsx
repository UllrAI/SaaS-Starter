import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { getSubscriptionStats } from "@/lib/admin/stats";
import type { AdminStats } from "../../_components/admin-stats-cards";

export async function SubscriptionStatsCards() {
  const stats: AdminStats["subscriptions"] = await getSubscriptionStats();

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
      />
      <StatCard
        title="Active Subscriptions"
        value={stats.active}
        description="Currently active plans"
        icon={UserCheck}
      />
      <StatCard
        title="Canceled Subscriptions"
        value={stats.canceled}
        description="Subscriptions marked for cancellation"
        icon={UserX}
      />
      <StatCard
        title="MRR (Placeholder)"
        value={monthlyRecurringRevenue}
        description="Monthly Recurring Revenue"
        icon={TrendingUp}
      />
    </div>
  );
}
