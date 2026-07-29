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
        title={t("admin_total_users", "Total Users")}
        value={stats.total}
        description={t("admin_all_registered_users", "All registered users")}
        icon={Users}
        locale={locale}
      />
      <StatCard
        title={t("admin_verified_users", "Verified Users")}
        value={stats.verified}
        description={t("user_verification_rate", "{rate}% verification rate", {
          rate: verificationRate,
        })}
        icon={UserCheck}
        locale={locale}
      />
      <StatCard
        title={t("admin_users", "Admin Users")}
        value={stats.admins}
        description={t("admin_super_users", "Admin and super admin users")}
        icon={Shield}
        locale={locale}
      />
      <StatCard
        title={t("admin_unverified_users", "Unverified Users")}
        value={unverified}
        description={t(
          "admin_require_email_verification",
          "Require email verification",
        )}
        icon={UserX}
        locale={locale}
      />
    </div>
  );
}
