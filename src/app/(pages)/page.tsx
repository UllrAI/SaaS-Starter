import { Hero } from "@/components/homepage/hero";
import { SocialProofUnified } from "@/components/homepage/social-proof-testimonials";
import { Features } from "@/components/homepage/features";
import { OtherProducts } from "@/components/homepage/other-products";
import { CallToAction } from "@/components/homepage/call-to-action";

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
