import { useTranslation } from "@/lib/i18n/translation/client";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { UploadWorkbench } from "./_components/upload-workbench";
export default function UploadPage() {
  const { t } = useTranslation();
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
