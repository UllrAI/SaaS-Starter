import { useTranslation } from "@/lib/i18n/translation/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
function SettingsPageTitle() {
  const { t } = useTranslation();
  return <>{t("settings_title")}</>;
}
function SettingsPageDescription() {
  const { t } = useTranslation();
  return <>{t("settings_personalize_appearance")}</>;
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
