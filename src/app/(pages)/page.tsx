import { Hero } from "@/components/homepage/hero";
import { SocialProofUnified } from "@/components/homepage/social-proof-testimonials";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function HomePageMetadataTitle() {
  return <>Micro SaaS Starter</>;
}

async function HomePageMetadataDescription() {
  return (
    <>
      Authentication, billing, uploads, and admin tooling for shipping a SaaS
      product faster.
    </>
  );
}

export async function generateMetadata() {
  return createPageMetadata({
    title: HomePageMetadataTitle,
    description: HomePageMetadataDescription,
  });
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
