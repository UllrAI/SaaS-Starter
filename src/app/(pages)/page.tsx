import { getServerTranslations } from "@/lib/i18n/translation/server";
import { Hero } from "@/components/homepage/hero";
import { SocialProofUnified } from "@/components/homepage/social-proof-testimonials";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE } from "@/lib/config/i18n";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/", SOURCE_LOCALE),
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
export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProofUnified />
      <Features />
      <OtherProducts />
      <CallToAction />
    </>
  );
}
