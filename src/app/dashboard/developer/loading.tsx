import { useTranslation } from "@/lib/i18n/translation/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
function DeveloperAccessPageTitle() {
  const { t } = useTranslation();
  return <>{t("5ec8aa48aae2", "Developer Access")}</>;
}
function DeveloperAccessPageDescription() {
  const { t } = useTranslation();
  return (
    <>
      {t(
        "9db4b59fc7ce",
        "Manage API keys, CLI sessions, and agent-friendly access from one place.",
      )}
    </>
  );
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
