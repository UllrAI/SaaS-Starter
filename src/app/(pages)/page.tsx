import { Hero } from "@/components/homepage/hero";
import { SocialProofUnified } from "@/components/homepage/social-proof-testimonials";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";
import { createLocalizedAlternates, createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/", locale),
  });

  return {
    ...metadata,
    title: "Micro SaaS Starter",
    description:
      "Authentication, billing, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    openGraph: {
      ...metadata.openGraph,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
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
