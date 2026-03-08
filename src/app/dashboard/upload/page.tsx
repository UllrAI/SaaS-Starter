import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { UploadWorkbench } from "./_components/upload-workbench";

export default function UploadPage() {
  return (
    <DashboardPageWrapper
      title={<>Uploads</>}
      description={
        <>
          A focused demo page for direct uploads, headless composition, and
          server-side file handling.
        </>
      }
    >
      <UploadWorkbench />
    </DashboardPageWrapper>
  );
}
