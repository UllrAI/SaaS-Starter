import { StatCard } from "@/components/admin/StatCard";
import { Upload, HardDrive, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUploadStatsDetails,
  type UploadStatsDetails,
} from "@/lib/admin/stats";

export async function UploadStatsCards() {
  const stats: UploadStatsDetails = await getUploadStatsDetails();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Uploads"
        value={stats.total}
        description={`${stats.recentUploads} in last 24h`}
        icon={Upload}
      />
      <StatCard
        title="Storage Used"
        value={stats.totalSizeFormatted}
        description={`Avg: ${stats.averageSizeFormatted}`}
        icon={HardDrive}
      />
      <StatCard
        title="Top File Type"
        value={stats.topFileTypes?.[0]?.type || "N/A"}
        description={`${stats.topFileTypes?.[0]?.count || 0} files`}
        icon={FileText}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">File Types</CardTitle>
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
