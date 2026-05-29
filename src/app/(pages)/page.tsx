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
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/", SOURCE_LOCALE),
  });

  return {
    ...metadata,
    title: "Micro SaaS Starter",
    description:
      "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    openGraph: {
      ...metadata.openGraph,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
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
