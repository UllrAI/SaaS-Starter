import PricingPage, { buildPricingMetadata } from "@/app/(pages)/pricing/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildPricingMetadata(locale);

  return withStaticLocalizedMetadata(metadata, "/pricing", locale);
}

export default async function LocalizedPricingPage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  return <PricingPage locale={locale} />;
}
