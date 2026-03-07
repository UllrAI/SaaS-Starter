import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";

function BillingPageTitle() {
  return <>Billing</>;
}

function BillingPageDescription() {
  return <>Manage your subscription, plan status, and payment history.</>;
}

export default function DashboardBillingLoading() {
  return (
    <DashboardPageWrapper
      title={<BillingPageTitle />}
      description={<BillingPageDescription />}
    >
      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </section>
    </DashboardPageWrapper>
  );
}
