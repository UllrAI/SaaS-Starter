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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Sparkles,
  Rocket,
  Zap,
} from "lucide-react";

export const metadata = createMetadata({
  title: "Home",
  description: "Dashboard home page with overview and quick actions",
});

export default function HomeRoute() {
  return (
    <DashboardPageWrapper title="Home">
      {/* Welcome Section */}
      <div className="from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden rounded-lg border bg-gradient-to-r p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            <Badge variant="secondary" className="text-xs">
              Welcome Back
            </Badge>
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">
            Good to see you again! 👋
          </h1>
          <p className="text-muted-foreground mb-4">
            Here&apos;s what&apos;s happening with your SaaS today. Your
            dashboard is ready to help you track progress and grow your
            business.
          </p>
          <div className="flex gap-3">
            <Button size="sm" className="gap-2">
              <Rocket className="h-4 w-4" />
              Quick Start
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-muted-foreground text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +20.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-muted-foreground text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +180.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-muted-foreground text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +19%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-muted-foreground text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +201
              </span>
              since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-primary h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to help you get started
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-primary h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your SaaS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-primary h-2 w-2 rounded-full" />
                <span className="text-muted-foreground">
                  New user registered
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  2m ago
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Payment received</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  5m ago
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Feature deployed</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  1h ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageWrapper>
  );
}
