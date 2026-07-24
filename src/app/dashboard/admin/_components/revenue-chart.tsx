"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { useIntlLocale } from "@/hooks/use-intl-locale";
interface RevenueData {
  month: string;
  revenue: number;
  count: number;
}
interface RevenueChartProps {
  chartData: RevenueData[];
}

export function formatRevenueMonth(month: string, locale: string): string {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function RevenueChart({ chartData }: RevenueChartProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();

  // Transform the data for the chart
  const transformedData = chartData
    .map((item) => ({
      month: formatRevenueMonth(item.month, intlLocale),
      revenue: item.revenue / 100,
      // Convert from cents to dollars
      count: item.count,
    }))
    .reverse(); // Reverse to show oldest to newest

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{t("6eb5f3635950", "No revenue data available")}</span>
        </div>
      </div>
    );
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={transformedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background rounded-lg border p-2 shadow-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">
                        {t("admin_settled_usd_revenue", "Settled USD Revenue")}
                      </span>
                      <span className="font-bold">
                        {formatCurrency(payload[0].value as number)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">
                        {t("admin_payments_label", "Payments")}
                      </span>
                      <span className="text-muted-foreground font-bold">
                        {payload[0].payload.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="revenue" className="fill-primary" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
