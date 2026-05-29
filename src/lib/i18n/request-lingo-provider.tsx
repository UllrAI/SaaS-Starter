import { AppLingoProvider } from "@/lib/i18n/lingo-provider";
import { loadLingoTranslations } from "@/lib/i18n/lingo-translations";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function RequestLingoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const translations = await loadLingoTranslations(locale);

  return (
    <AppLingoProvider initialLocale={locale} initialTranslations={translations}>
      {children}
    </AppLingoProvider>
  );
}
