import { AppLingoProvider } from "@/lib/i18n/lingo-provider";
import { loadLingoTranslations } from "@/lib/i18n/lingo-translations";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import type { SupportedLocale } from "@/lib/config/i18n";

export async function LocaleLingoProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: SupportedLocale;
}) {
  const translations = await loadLingoTranslations(locale);

  return (
    <AppLingoProvider initialLocale={locale} initialTranslations={translations}>
      {children}
    </AppLingoProvider>
  );
}

export async function RequestLingoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();

  return <LocaleLingoProvider locale={locale}>{children}</LocaleLingoProvider>;
}
