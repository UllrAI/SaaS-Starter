import React from "react";
import { DashboardPageWrapper } from "./_components/dashboard-page-wrapper";
import { createMetadata } from "@/lib/metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Terminal,
  ArrowUpRight,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "System overview and metrics",
});

export default function HomeRoute() {
  return (
    <DashboardPageWrapper title="Dashboard">
      {/* System Status / Welcome Panel */}
      <div className="bg-card text-card-foreground mb-8 border shadow-sm">
        <div className="bg-muted/50 flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="text-primary h-4 w-4" />
            <span className="font-mono text-sm font-bold">system_status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="bg-emerald-500 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-emerald-500 relative inline-flex h-2 w-2 rounded-full"></span>
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              ONLINE
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-foreground mb-2 text-2xl font-bold tracking-tight">
              Welcome back, User
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              System is running smoothly. All services operational.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="sm" className="gap-2 shadow-xs">
              <Zap className="h-4 w-4" />
              Deploy New Project
            </Button>
            <Button variant="outline" size="sm" className="gap-2 shadow-xs">
              <Activity className="h-4 w-4" />
              View Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-lingo-skip>
              $45,231.89
            </div>
            <p className="text-muted-foreground text-xs">
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span data-lingo-skip>+20.1%</span>
              </span>
              <span className="opacity-70">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-lingo-skip>
              +2,350
            </div>
            <p className="text-muted-foreground text-xs">
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span data-lingo-skip>+180.1%</span>
              </span>
              <span className="opacity-70">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-lingo-skip>
              +12,234
            </div>
            <p className="text-muted-foreground text-xs">
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span data-lingo-skip>+19%</span>
              </span>
              <span className="opacity-70">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-lingo-skip>
              +573
            </div>
            <p className="text-muted-foreground text-xs">
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span data-lingo-skip>+201</span>
              </span>
              <span className="opacity-70">since last hour</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="text-primary h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-primary/20">
                  <Users className="h-3 w-3" />
                </div>
                <div className="grid gap-1">
                  <p className="text-foreground font-medium leading-none">
                    New user registered
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    user_id: 8923 • 2m ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="bg-emerald-500/10 text-emerald-600 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-emerald-500/20">
                  <DollarSign className="h-3 w-3" />
                </div>
                <div className="grid gap-1">
                  <p className="text-foreground font-medium leading-none">
                    Payment received
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    inv_2930 • $49.00 • 5m ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="bg-blue-500/10 text-blue-600 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-blue-500/20">
                  <Zap className="h-3 w-3" />
                </div>
                <div className="grid gap-1">
                  <p className="text-foreground font-medium leading-none">
                    Feature deployed
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    v2.4.0 • main_branch • 1h ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2 shadow-xs"
              >
                <ArrowUpRight className="h-4 w-4" />
                Upgrade Plan
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 shadow-xs"
              >
                <Users className="h-4 w-4" />
                Manage Team
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify Domain
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageWrapper>
  );
}
