import { useTranslation } from "@/lib/i18n/translation/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
function SettingsPageTitle() {
  const { t } = useTranslation();
  return <>{t("6f5eb075c7ea", "Settings")}</>;
}
function SettingsPageDescription() {
  const { t } = useTranslation();
  return (
    <>
      {t(
        "95ebba96b384",
        "Manage your account profile and personalize dashboard appearance.",
      )}
    </>
  );
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
