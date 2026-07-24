import HomePage, { buildHomeMetadata } from "@/app/(pages)/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildHomeMetadata(locale);

  return withStaticLocalizedMetadata(metadata, "/", locale);
}

export default async function LocalizedHomePage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  return <HomePage locale={locale} />;
}
