import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";

function SettingsPageTitle() {
  return <>Settings</>;
}

function SettingsPageDescription() {
  return <>Manage your account profile and personalize dashboard appearance.</>;
}

export default function DashboardSettingsLoading() {
  return (
    <DashboardPageWrapper
      title={<SettingsPageTitle />}
      description={<SettingsPageDescription />}
    >
      <section className="space-y-8">
        <section className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-24 w-full" />
        </section>
        <section className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-52 w-full" />
        </section>
      </section>
    </DashboardPageWrapper>
  );
}
