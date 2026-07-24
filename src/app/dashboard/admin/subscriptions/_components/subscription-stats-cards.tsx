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
        title={t("687ec1f6703c", "Total Subscriptions")}
        value={stats.total}
        description={t("b92d1f928be4", "All-time subscriptions")}
        icon={Users}
        locale={locale}
      />
      <StatCard
        title={t("900768ed39ea", "Active Subscriptions")}
        value={stats.active}
        description={t("53368a6ea5de", "Currently active plans")}
        icon={UserCheck}
        locale={locale}
      />
      <StatCard
        title={t("81777d2ec394", "Canceled Subscriptions")}
        value={stats.canceled}
        description={t("c72d5f99932f", "Subscriptions marked for cancellation")}
        icon={UserX}
        locale={locale}
      />
      <StatCard
        title={t("8eeccb8c3a30", "Activation Rate")}
        value={`${activationRate}%`}
        description={t(
          "f4561fcfdbf1",
          "Share of subscriptions currently active",
        )}
        icon={TrendingUp}
        locale={locale}
      />
    </div>
  );
}
