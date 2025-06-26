"use client";

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load chart components to reduce initial bundle size
const RevenueChart = lazy(() =>
  import("./revenue-chart").then((module) => ({
    default: module.RevenueChart,
  })),
);

const RecentUsersChart = lazy(() =>
  import("./recent-users-chart").then((module) => ({
    default: module.RecentUsersChart,
  })),
);

// Loading skeleton for charts
function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className={`w-full h-[${height}px] rounded-lg`} />
    </div>
  );
}

// Props interfaces for type safety
interface RevenueData {
  month: string;
  revenue: number;
  count: number;
}

interface ChartData {
  date: string;
  count: number;
}

interface LazyRevenueChartProps {
  chartData: RevenueData[];
}

interface LazyRecentUsersChartProps {
  chartData: ChartData[];
}

// Lazy-loaded Revenue Chart with proper error boundary
export function LazyRevenueChart({ chartData }: LazyRevenueChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={400} />}>
      <RevenueChart chartData={chartData} />
    </Suspense>
  );
}

// Lazy-loaded Recent Users Chart with proper error boundary
export function LazyRecentUsersChart({ chartData }: LazyRecentUsersChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={300} />}>
      <RecentUsersChart chartData={chartData} />
    </Suspense>
  );
}
