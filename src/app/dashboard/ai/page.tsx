import { notFound } from "next/navigation";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import { SITE_CONFIG } from "@/lib/config/site";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AiChat } from "./_components/ai-chat";
import { AiResponseDisclaimer } from "./_components/ai-response-disclaimer";

export async function generateMetadata() {
  const { t } = await getServerTranslations();
  return { title: t("dashboard_ai_assistant") };
}

export default async function AiAssistantPage() {
  if (!SITE_CONFIG.features.ai) {
    notFound();
  }

  const { t } = await getServerTranslations();
  return (
    <DashboardPageWrapper
      title={<>{t("dashboard_ai_assistant")}</>}
      description={<>{t("ai_chat_page_description")}</>}
      actions={<AiResponseDisclaimer message={t("ai_chat_disclaimer")} />}
      headerClassName="mb-0"
      mainClassName="flex min-h-0 flex-1 overflow-hidden p-0 sm:px-4"
    >
      <AiChat />
    </DashboardPageWrapper>
  );
}
