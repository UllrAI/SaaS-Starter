import AboutPage, { buildAboutMetadata } from "@/app/(pages)/about/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";
import type { Metadata } from "next";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildAboutMetadata(locale);

  return withStaticLocalizedMetadata(metadata, "/about", locale);
}

export default async function LocalizedAboutPage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  return <AboutPage locale={locale} />;
}
