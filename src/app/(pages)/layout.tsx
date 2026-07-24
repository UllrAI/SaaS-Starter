import {
  AppDocument,
  createRootMetadata,
} from "@/components/layout/app-document";
import { MarketingChrome } from "@/components/layout/marketing-chrome";
import { MarketingProviders } from "@/providers/marketing-providers";
import { loadMarketingMessages } from "@/lib/i18n/messages";
import { SOURCE_LOCALE } from "@/lib/config/i18n";

export const dynamic = "force-static";

export function generateMetadata() {
  return createRootMetadata(SOURCE_LOCALE);
}

export default async function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await loadMarketingMessages(SOURCE_LOCALE);

  return (
    <AppDocument locale={SOURCE_LOCALE} messages={messages}>
      <MarketingProviders>
        <MarketingChrome locale={SOURCE_LOCALE}>{children}</MarketingChrome>
      </MarketingProviders>
    </AppDocument>
  );
}
