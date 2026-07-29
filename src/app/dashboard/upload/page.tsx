import { getServerTranslations } from "@/lib/i18n/translation/server";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
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
      title={<>{t("cd7b070e19ed", "Uploads")}</>}
      description={
        <>
          {t(
            "8efbfbda101e",
            "A focused demo page for direct uploads, headless composition, and server-side file handling.",
          )}
        </>
      }
    >
      <UploadWorkbench />
    </DashboardPageWrapper>
  );
}
