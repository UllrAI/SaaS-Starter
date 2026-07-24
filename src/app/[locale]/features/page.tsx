import FeaturesPage, {
  buildFeaturesMetadata,
} from "@/app/(pages)/features/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildFeaturesMetadata(locale);

  return withStaticLocalizedMetadata(metadata, "/features", locale);
}

export default async function LocalizedFeaturesPage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  return <FeaturesPage locale={locale} />;
}
