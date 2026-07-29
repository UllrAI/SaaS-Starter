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
      <p>
        {t(
          "auth_weve_sent_secure_magic_link",
          "We've sent a secure magic-link to",
        )}
      </p>
      <p className="text-foreground font-bold break-all">
        {t("auth_email_address_description", "your email address")}
      </p>
      <p>
        {t(
          "auth_click_link_in_email_sign",
          "Click the link in the email to sign in.",
        )}
      </p>
    </div>
  );
  return (
    <LinkSentCard
      title={t("auth_check_email", "Check your email")}
      description={description}
      retryHref="/login"
    />
  );
}
