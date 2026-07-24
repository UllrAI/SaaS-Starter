import { render, screen } from "@testing-library/react";
import type React from "react";

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

const mockProductProof = createMockSection("ProductProof");
jest.mock("@/components/homepage/product-proof", () => ({
  ProductProof: (props: React.ComponentProps<any>) => mockProductProof(props),
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

const mockCreateLocalizedAlternates = jest.fn(() => ({
  canonical: "/",
  languages: {
    en: "/",
    "zh-Hans": "/zh-Hans",
  },
}));
const mockCreateMetadataDefaults = jest.fn(() => ({
  openGraph: {
    siteName: "UllrAI",
  },
  twitter: {
    card: "summary_large_image",
  },
}));
jest.mock("@/lib/metadata", () => ({
  createLocalizedAlternates: (...args: unknown[]) =>
    mockCreateLocalizedAlternates(...args),
  createMetadataDefaults: (...args: unknown[]) =>
    mockCreateMetadataDefaults(...args),
}));

import HomePage, { generateMetadata } from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds localized metadata for the marketing homepage", async () => {
    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Micro SaaS Starter",
      description:
        "Authentication, billing, agent-ready APIs, CLI device auth, uploads, admin tooling, and Playwright-backed smoke coverage for shipping a SaaS product faster.",
    });

    expect(mockCreateLocalizedAlternates).toHaveBeenCalledWith("/", "en");
    expect(mockCreateMetadataDefaults).toHaveBeenCalledWith({
      locale: "en",
      alternates: {
        canonical: "/",
        languages: {
          en: "/",
          "zh-Hans": "/zh-Hans",
        },
      },
    });
  });

  it("renders the marketing sections in the expected order", () => {
    render(<HomePage />);

    const sections = screen.getAllByTestId("homepage-section");
    expect(
      sections.map((section) => section.getAttribute("data-component")),
    ).toEqual([
      "Hero",
      "ProductProof",
      "Features",
      "OtherProducts",
      "CallToAction",
    ]);

    expect(mockHero).toHaveBeenCalledTimes(1);
    expect(mockProductProof).toHaveBeenCalledTimes(1);
    expect(mockFeatures).toHaveBeenCalledTimes(1);
    expect(mockOtherProducts).toHaveBeenCalledTimes(1);
    expect(mockCallToAction).toHaveBeenCalledTimes(1);
  });
});
