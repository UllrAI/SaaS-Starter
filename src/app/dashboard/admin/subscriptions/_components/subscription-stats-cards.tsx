import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { getSubscriptionStats } from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function SubscriptionStatsCards() {
  const [locale, stats] = await Promise.all([
    getRequestLocale(),
    getSubscriptionStats(),
  ]);
  const activationRate =
    stats.total === 0 ? 0 : Math.round((stats.active / stats.total) * 100);

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
        title="Activation Rate"
        value={`${activationRate}%`}
        description="Share of subscriptions currently active"
        icon={TrendingUp}
        locale={locale}
      />
    </div>
  );
}
