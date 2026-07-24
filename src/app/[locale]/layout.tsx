import { setRequestLocale } from "next-intl/server";

import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingParams,
} from "@/lib/i18n/static-marketing-locale";
import {
  AppDocument,
  createRootMetadata,
} from "@/components/layout/app-document";
import { MarketingChrome } from "@/components/layout/marketing-chrome";
import { MarketingProviders } from "@/providers/marketing-providers";
import { loadMarketingMessages } from "@/lib/i18n/messages";
import { LocalePersistence } from "@/components/locale-persistence";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getStaticMarketingLocaleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveStaticMarketingParams(params);
  return createRootMetadata(locale);
}

export default async function LocalizedMarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveStaticMarketingParams(params);
  setRequestLocale(locale);
  const messages = await loadMarketingMessages(locale);

  return (
    <AppDocument locale={locale} messages={messages}>
      <MarketingProviders>
        <LocalePersistence locale={locale} />
        <MarketingChrome locale={locale}>{children}</MarketingChrome>
      </MarketingProviders>
    </AppDocument>
  );
}
