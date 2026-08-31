import type { ReactNode } from "react";

import { Footer } from "@/components/homepage/footer";
import { Header } from "@/components/homepage/header";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SkipLink } from "./skip-link";

export function MarketingChrome({
  children,
  locale = SOURCE_LOCALE,
}: {
  children: ReactNode;
  locale?: SupportedLocale;
}) {
  const { t } = getStaticTranslations(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink label={t("common_skip_to_content")} />
      <Header locale={locale} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
