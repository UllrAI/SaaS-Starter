import { getServerTranslations } from "@/lib/i18n/translation/server";
import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { getSubscriptionStats } from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";
export async function SubscriptionStatsCards() {
  const { t } = await getServerTranslations();
  const [locale, stats] = await Promise.all([
    getRequestLocale(),
    getSubscriptionStats(),
  ]);
  const activationRate =
    stats.total === 0 ? 0 : Math.round((stats.active / stats.total) * 100);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("admin_total_subscriptions")}
        value={stats.total}
        description={t("admin_all_time_subscriptions")}
        icon={Users}
        locale={locale}
      />
      <StatCard
        title={t("admin_active_subscriptions")}
        value={stats.active}
        description={t("admin_currently_active_plans")}
        icon={UserCheck}
        locale={locale}
      />
      <StatCard
        title={t("admin_canceled_subscriptions")}
        value={stats.canceled}
        description={t("admin_subscriptions_marked_cancellation")}
        icon={UserX}
        locale={locale}
      />
      <StatCard
        title={t("admin_activation_rate")}
        value={`${activationRate}%`}
        description={t("admin_share_subscriptions_currently_active")}
        icon={TrendingUp}
        locale={locale}
      />
    </div>
  );
}
