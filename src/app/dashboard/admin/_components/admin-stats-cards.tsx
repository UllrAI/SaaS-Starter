import { useTranslation } from "@/lib/i18n/translation/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/config/upload";
import { resolveIntlLocale } from "@/lib/locale";
import { CreditCard, Shield, TrendingUp, Upload, Users } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config/site";
export interface AdminStats {
  users: {
    total: number;
    verified: number;
    admins: number;
  };
  subscriptions: {
    total: number;
    active: number;
    canceled: number;
  };
  payments: {
    total: number;
    totalRevenue: number;
    successful: number;
  };
  uploads: {
    total: number;
    totalSize: number;
  };
}
interface AdminStatsCardsProps {
  stats: AdminStats;
  locale: string;
}
export function AdminStatsCards({ stats, locale }: AdminStatsCardsProps) {
  const { t } = useTranslation();
  const intlLocale = resolveIntlLocale(locale);
  const formatStatsCurrency = (amountInCents: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amountInCents / 100);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("admin_total_users")}
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.users.total.toLocaleString(intlLocale)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("admin_verified", {
                expression0: stats.users.verified,
              })}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t("admin_admins", {
                expression0: stats.users.admins,
              })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {SITE_CONFIG.features.billing && (
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              {t("admin_active_subscriptions_stats")}
            </CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.subscriptions.active.toLocaleString(intlLocale)}
            </div>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              {t.rich("admin_total_canceled", {
                expression0: stats.subscriptions.total,
                expression1: stats.subscriptions.canceled,
                TrendingUp0: () => (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ),
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {SITE_CONFIG.features.billing && (
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              {t("admin_settled_usd_revenue")}
            </CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatStatsCurrency(stats.payments.totalRevenue)}
            </div>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              {t.rich("admin_successful_payments_stats", {
                expression0: stats.payments.successful,
                TrendingUp0: () => (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ),
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {SITE_CONFIG.features.uploads && (
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              {t("admin_file_uploads")}
            </CardTitle>
            <Upload className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.uploads.total.toLocaleString(intlLocale)}
            </div>
            <p className="text-muted-foreground text-xs">
              {t("admin_total", {
                expression0: formatFileSize(stats.uploads.totalSize),
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
