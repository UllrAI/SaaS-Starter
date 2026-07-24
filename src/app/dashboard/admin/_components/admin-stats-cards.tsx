import { useTranslation } from "@/lib/i18n/translation/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/config/upload";
import { resolveIntlLocale } from "@/lib/locale";
import { CreditCard, Shield, TrendingUp, Upload, Users } from "lucide-react";
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
            {t("802fcb9aa4ff", "Total Users")}
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.users.total.toLocaleString(intlLocale)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("6a1363cfb29f", "{expression0} verified", {
                expression0: stats.users.verified,
              })}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t("99b079005c88", "{expression0} admins", {
                expression0: stats.users.admins,
              })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("dcefef9c76ad", "Active Subscriptions")}
          </CardTitle>
          <Shield className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.subscriptions.active.toLocaleString(intlLocale)}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            {t(
              "cda1c85c48d8",
              "<TrendingUp0></TrendingUp0>{expression0} total \u2022 {expression1} canceled",
              {
                expression0: stats.subscriptions.total,
                expression1: stats.subscriptions.canceled,
                TrendingUp0: () => (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ),
              },
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("admin_settled_usd_revenue", "Settled USD Revenue")}
          </CardTitle>
          <CreditCard className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatStatsCurrency(stats.payments.totalRevenue)}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            {t(
              "ff4e54d1b22b",
              "<TrendingUp0></TrendingUp0>{expression0} successful payments",
              {
                expression0: stats.payments.successful,
                TrendingUp0: () => (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ),
              },
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("0445c5d97978", "File Uploads")}
          </CardTitle>
          <Upload className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uploads.total.toLocaleString(intlLocale)}
          </div>
          <p className="text-muted-foreground text-xs">
            {t("260455ef1aa8", "{expression0} total", {
              expression0: formatFileSize(stats.uploads.totalSize),
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
