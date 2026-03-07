import { Hero } from "@/components/homepage/hero";
import { SocialProofUnified } from "@/components/homepage/social-proof-testimonials";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";
import { createMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Micro SaaS Starter",
    description:
      "Authentication, billing, uploads, and admin tooling for shipping a SaaS product faster.",
    openGraph: {
      ...metadata.openGraph,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, uploads, and admin tooling for shipping a SaaS product faster.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, uploads, and admin tooling for shipping a SaaS product faster.",
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
