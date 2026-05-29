import {
  BlogPageContent,
  generateMetadata as generateSourceMetadata,
} from "@/app/(pages)/blog/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await generateSourceMetadata();

  return withStaticLocalizedMetadata(metadata, "/blog", locale);
}

export default async function LocalizedBlogPage({
  params,
}: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);

  return <BlogPageContent locale={locale} />;
}
