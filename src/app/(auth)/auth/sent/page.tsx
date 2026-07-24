import { getServerTranslations } from "@/lib/i18n/translation/server";
import { LinkSentCard } from "@/components/auth/link-sent-card";

export default async function MagicLinkSent() {
  const { t } = await getServerTranslations();
  const description = (
    <div className="space-y-3">
      <p>{t("1d1b034f1837", "We've sent a secure magic-link to")}</p>
      <p className="text-foreground font-bold break-all">
        {t("de2b0fad97e2", "your email address")}
      </p>
      <p>{t("f944bc57745b", "Click the link in the email to sign in.")}</p>
    </div>
  );
  return (
    <LinkSentCard
      title={t("82feba1099ff", "Check your email")}
      description={description}
      retryHref="/login"
    />
  );
}
