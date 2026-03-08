import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/config/upload";
import { resolveIntlLocale } from "@/lib/locale";
import {
  CreditCard,
  Shield,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

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
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.users.total.toLocaleString(intlLocale)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.users.verified} verified
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.users.admins} admins
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            Active Subscriptions
          </CardTitle>
          <Shield className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.subscriptions.active.toLocaleString(intlLocale)}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            {stats.subscriptions.total} total • {stats.subscriptions.canceled}{" "}
            canceled
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CreditCard className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatStatsCurrency(stats.payments.totalRevenue)}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            {stats.payments.successful} successful payments
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">File Uploads</CardTitle>
          <Upload className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uploads.total.toLocaleString(intlLocale)}
          </div>
          <p className="text-muted-foreground text-xs">
            {formatFileSize(stats.uploads.totalSize)} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
