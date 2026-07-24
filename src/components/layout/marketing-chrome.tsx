import type { ReactNode } from "react";

import { Footer } from "@/components/homepage/footer";
import { Header } from "@/components/homepage/header";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";

export function MarketingChrome({
  children,
  locale = SOURCE_LOCALE,
}: {
  children: ReactNode;
  locale?: SupportedLocale;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
