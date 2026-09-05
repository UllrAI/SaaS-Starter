import { getServerTranslations } from "@/lib/i18n/translation/server";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { MyFiles } from "./_components/my-files";
import { UploadWorkbench } from "./_components/upload-workbench";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";

export default async function UploadPage() {
  if (!SITE_CONFIG.features.uploads) {
    notFound();
  }

  const { t } = await getServerTranslations();
  return (
    <DashboardPageWrapper
      title={<>{t("uploads_title_dashboard")}</>}
      description={<>{t("uploads_demo_page")}</>}
    >
      <div className="space-y-10">
        <MyFiles />
        <UploadWorkbench />
      </div>
    </DashboardPageWrapper>
  );
}
