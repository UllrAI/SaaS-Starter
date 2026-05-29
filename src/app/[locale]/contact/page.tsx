import ContactPage, {
  generateMetadata as generateSourceMetadata,
} from "@/app/(pages)/contact/page";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await generateSourceMetadata();

  return withStaticLocalizedMetadata(metadata, "/contact", locale);
}

export default ContactPage;
