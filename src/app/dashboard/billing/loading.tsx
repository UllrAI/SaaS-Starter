import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardBillingLoading() {
  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-72 w-full" />
    </section>
  );
}
