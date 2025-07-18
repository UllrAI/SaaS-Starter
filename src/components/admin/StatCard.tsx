import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-24" /> : value.toLocaleString()}
        </div>
        {description && (
          <div className="text-muted-foreground text-xs">
            {loading ? <Skeleton className="h-4 w-32" /> : description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
