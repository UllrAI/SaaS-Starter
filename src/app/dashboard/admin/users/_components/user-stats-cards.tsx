import { getServerTranslations } from "@/lib/i18n/translation/server";
import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, Shield, UserX } from "lucide-react";
import { getUserStats } from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";
export async function UserStatsCards() {
  const { t } = await getServerTranslations();
  const [locale, stats] = await Promise.all([
    getRequestLocale(),
    getUserStats(),
  ]);
  const verificationRate =
    stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : "0";
  const unverified = stats.total - stats.verified;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("fd620fc522e1", "Total Users")}
        value={stats.total}
        description={t("b13bed21761c", "All registered users")}
        icon={Users}
        locale={locale}
      />
      <StatCard
        title={t("c0970292b61e", "Verified Users")}
        value={stats.verified}
        description={`${verificationRate}% verification rate`}
        icon={UserCheck}
        locale={locale}
      />
      <StatCard
        title={t("5cfb12032149", "Admin Users")}
        value={stats.admins}
        description={t("252a9d353b11", "Admin and super admin users")}
        icon={Shield}
        locale={locale}
      />
      <StatCard
        title={t("b66f53732c43", "Unverified Users")}
        value={unverified}
        description={t("26933cd62470", "Require email verification")}
        icon={UserX}
        locale={locale}
      />
    </div>
  );
}
