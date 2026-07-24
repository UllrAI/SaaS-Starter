import { getServerTranslations } from "@/lib/i18n/translation/server";
import { Hero } from "@/components/homepage/hero";
import { ProductProof } from "@/components/homepage/product-proof";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE } from "@/lib/config/i18n";
import type { SupportedLocale } from "@/lib/config/i18n";
export async function buildHomeMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("a540f290f338", "Micro SaaS Starter"),
    description: t(
      "cb526bb94740",
      "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("aaf6b613d131", "Micro SaaS Starter"),
      description: t(
        "984bccdfc28f",
        "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("6b203706c298", "Micro SaaS Starter"),
      description: t(
        "11ebf5b98e95",
        "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildHomeMetadata(SOURCE_LOCALE);
}
export default function HomePage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  return (
    <>
      <Hero locale={locale} />
      <ProductProof locale={locale} />
      <Features locale={locale} />
      <OtherProducts locale={locale} />
      <CallToAction locale={locale} />
    </>
  );
}
