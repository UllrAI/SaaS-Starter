import { Suspense } from "react";
import { PaymentStatusContent } from "./_components/payment-status-content";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

function PaymentStatusSkeleton() {
  return (
    <section className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <div className="relative mx-auto max-w-md px-6">
        {/* Status Badge Skeleton */}
        <div className="mb-8 text-center">
          <div className="border-border bg-background/50 inline-flex items-center rounded-full border px-4 py-2 backdrop-blur-sm">
            <Badge variant="secondary" className="gap-2">
              <Clock className="h-3 w-3" />
              Loading...
            </Badge>
          </div>
        </div>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto mb-4 h-8 w-64" />
            <Skeleton className="mx-auto mb-8 h-4 w-80" />
            <Skeleton className="mx-auto mb-3 h-10 w-48" />
            <Skeleton className="mx-auto h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<PaymentStatusSkeleton />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
