import { render, screen } from "@testing-library/react";
import type React from "react";
import HomePage from "./page";

const createMockSection = (label: string) =>
  jest.fn(() => (
    <section data-testid="homepage-section" data-component={label}>
      {label}
    </section>
  ));

const mockHero = createMockSection("Hero");
jest.mock("@/components/homepage/hero", () => ({
  Hero: (props: React.ComponentProps<any>) => mockHero(props),
}));

const mockSocialProof = createMockSection("SocialProofUnified");
jest.mock("@/components/homepage/social-proof-testimonials", () => ({
  SocialProofUnified: (props: React.ComponentProps<any>) =>
    mockSocialProof(props),
}));

const mockFeatures = createMockSection("Features");
jest.mock("@/components/homepage/features", () => ({
  Features: (props: React.ComponentProps<any>) => mockFeatures(props),
}));

const mockOtherProducts = createMockSection("OtherProducts");
jest.mock("@/components/homepage/other-products", () => ({
  OtherProducts: (props: React.ComponentProps<any>) => mockOtherProducts(props),
}));

const mockCallToAction = createMockSection("CallToAction");
jest.mock("@/components/homepage/call-to-action", () => ({
  CallToAction: (props: React.ComponentProps<any>) => mockCallToAction(props),
}));

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the marketing sections in the expected order", () => {
    render(<HomePage />);

    const sections = screen.getAllByTestId("homepage-section");
    expect(
      sections.map((section) => section.getAttribute("data-component")),
    ).toEqual([
      "Hero",
      "SocialProofUnified",
      "Features",
      "OtherProducts",
      "CallToAction",
    ]);

    expect(mockHero).toHaveBeenCalledTimes(1);
    expect(mockSocialProof).toHaveBeenCalledTimes(1);
    expect(mockFeatures).toHaveBeenCalledTimes(1);
    expect(mockOtherProducts).toHaveBeenCalledTimes(1);
    expect(mockCallToAction).toHaveBeenCalledTimes(1);
  });
});
