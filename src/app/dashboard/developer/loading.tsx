import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";

function DeveloperAccessPageTitle() {
  return <>Developer Access</>;
}

function DeveloperAccessPageDescription() {
  return <>Manage API keys, CLI sessions, and agent-friendly access from one place.</>;
}

export default function DashboardDeveloperAccessLoading() {
  return (
    <DashboardPageWrapper
      title={<DeveloperAccessPageTitle />}
      description={<DeveloperAccessPageDescription />}
    >
      <section className="space-y-6">
        <section className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-40 w-full" />
        </section>
        <section className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-40 w-full" />
        </section>
      </section>
    </DashboardPageWrapper>
  );
}
