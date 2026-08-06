import { getServerTranslations } from "@/lib/i18n/translation/server";
import { LinkSentCard } from "@/components/auth/link-sent-card";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";

export default async function MagicLinkSent() {
  if (!SITE_CONFIG.features.emailAuth) {
    notFound();
  }
  const { t } = await getServerTranslations();
  const description = (
    <div className="space-y-3">
      <p>{t("auth_weve_sent_secure_magic_link")}</p>
      <p className="text-foreground font-bold break-all">
        {t("auth_email_address_description")}
      </p>
      <p>{t("auth_click_link_in_email_sign")}</p>
    </div>
  );
  return (
    <LinkSentCard
      title={t("auth_check_email")}
      description={description}
      retryHref="/login"
    />
  );
}
