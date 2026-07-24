import TermsPage, { buildTermsMetadata } from "@/app/(pages)/terms/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildTermsMetadata(locale);

  return withStaticLocalizedMetadata(metadata, "/terms", locale);
}

export default async function LocalizedTermsPage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  return <TermsPage locale={locale} />;
}
