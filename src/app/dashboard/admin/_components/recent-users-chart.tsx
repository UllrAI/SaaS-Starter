"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface ChartData {
  date: string;
  count: number;
}

interface RecentUsersChartProps {
  chartData: ChartData[];
}

export function RecentUsersChart({ chartData }: RecentUsersChartProps) {
  // Transform the data for the chart
  const transformedData = chartData
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: item.count,
    }))
    .reverse(); // Reverse to show oldest to newest

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="text-muted-foreground flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>No user data available</span>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={transformedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background rounded-lg border p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">
                        Date
                      </span>
                      <span className="text-muted-foreground font-bold">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">
                        New Users
                      </span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          className="stroke-primary"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
