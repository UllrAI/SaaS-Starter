"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Users,
  CreditCard,
  Upload,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/config/upload";

// This type is also used by lib/admin/stats.ts
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
  initialStats: AdminStats;
}

export function AdminStatsCards({ initialStats }: AdminStatsCardsProps) {
  if (!initialStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load statistics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = initialStats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount / 100); // Assuming amount is in cents
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.users.total.toLocaleString()}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Subscriptions
          </CardTitle>
          <Shield className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.subscriptions.active.toLocaleString()}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            {stats.subscriptions.total} total • {stats.subscriptions.canceled}{" "}
            canceled
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CreditCard className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.payments.totalRevenue)}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            {stats.payments.successful} successful payments
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">File Uploads</CardTitle>
          <Upload className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uploads.total.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">
            {formatFileSize(stats.uploads.totalSize)} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
