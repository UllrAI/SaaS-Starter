import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border-border bg-card space-y-4 border p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </section>

        <section className="border-border bg-card space-y-4 border p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="border-border bg-card space-y-4 border p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </section>

        <section className="border-border bg-card space-y-4 border p-6">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </section>
      </div>
    </div>
  );
}
