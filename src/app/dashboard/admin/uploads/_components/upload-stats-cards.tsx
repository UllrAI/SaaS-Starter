import { getServerTranslations } from "@/lib/i18n/translation/server";
import { StatCard } from "@/components/admin/StatCard";
import { Upload, HardDrive, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUploadStatsDetails } from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";
export async function UploadStatsCards() {
  const { t } = await getServerTranslations();
  const [locale, stats] = await Promise.all([
    getRequestLocale(),
    getUploadStatsDetails(),
  ]);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("admin_total_uploads")}
        value={stats.total}
        description={t("upload_recent_count", {
          count: stats.recentUploads,
        })}
        icon={Upload}
        locale={locale}
      />
      <StatCard
        title={t("admin_storage_used")}
        value={stats.totalSizeFormatted}
        description={t("upload_average_size", {
          size: stats.averageSizeFormatted,
        })}
        icon={HardDrive}
        locale={locale}
      />
      <StatCard
        title={t("admin_top_file_type")}
        value={stats.topFileTypes?.[0]?.type ?? t("common_not_available")}
        description={t("upload_file_count", {
          count: stats.topFileTypes?.[0]?.count ?? 0,
        })}
        icon={FileText}
        locale={locale}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("admin_file_types")}
          </CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stats.topFileTypes.slice(0, 3).map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between"
              >
                <Badge variant="outline" className="text-xs">
                  {type.type}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {type.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
