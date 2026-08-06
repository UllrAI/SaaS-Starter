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
    title: t("home_micro_saas_starter"),
    description: t("home_auth_billing_apis_cli"),
    openGraph: {
      ...metadata.openGraph,
      title: t("home_micro_saas_starter"),
      description: t("home_auth_billing_apis_cli"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("home_micro_saas_starter"),
      description: t("home_auth_billing_apis_cli"),
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
