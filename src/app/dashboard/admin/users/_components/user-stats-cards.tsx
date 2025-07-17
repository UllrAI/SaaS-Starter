import { StatCard } from "@/components/admin/StatCard";
import { Users, UserCheck, Shield, UserX } from "lucide-react";
import { getUserStats } from "@/lib/admin/stats";
import type { AdminStats } from "../../_components/admin-stats-cards";

export async function UserStatsCards() {
  const stats: AdminStats["users"] = await getUserStats();

  const verificationRate =
    stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : "0";
  const unverified = stats.total - stats.verified;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={stats.total}
        description="All registered users"
        icon={Users}
      />
      <StatCard
        title="Verified Users"
        value={stats.verified}
        description={`${verificationRate}% verification rate`}
        icon={UserCheck}
      />
      <StatCard
        title="Admin Users"
        value={stats.admins}
        description="Admin and super admin users"
        icon={Shield}
      />
      <StatCard
        title="Unverified Users"
        value={unverified}
        description="Require email verification"
        icon={UserX}
      />
    </div>
  );
}
