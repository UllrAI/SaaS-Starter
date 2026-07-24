import { describe, it, expect } from "@jest/globals";
import { createLocalizedAlternates, createMetadataDefaults } from "./metadata";
import type { Metadata } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";

type OpenGraphMetadata = OpenGraph;

describe("createMetadataDefaults", () => {
  // Use the actual values from the global mocks/constants
  const expectedAppName =
    process.env.NODE_ENV === "development"
      ? "DEV - SaaS Starter"
      : "SaaS Starter";
  const expectedSocialImage = {
    url: "/og.png",
    width: 1480,
    height: 777,
    alt: expectedAppName,
  };
  const mockAppUrl = "http://localhost:3000";
  const mockTwitterAccount = "@ullr_ai";

  it("should create metadata with default values when override is empty", () => {
    const result = createMetadataDefaults();

    expect(result.openGraph?.url).toBeUndefined();
    expect(result.openGraph?.images).toEqual([expectedSocialImage]);
    expect(result.openGraph?.siteName).toBe(expectedAppName);
    expect((result.openGraph as Record<string, unknown>)?.type).toBe("website");
    expect(result.openGraph?.locale).toBe("en_US");
    expect(result.openGraph?.alternateLocale).toEqual(["zh_CN"]);
    expect((result.twitter as Record<string, unknown>)?.card).toBe(
      "summary_large_image",
    );
    expect(result.twitter?.creator).toBe(mockTwitterAccount);
    expect(result.twitter?.images).toEqual([expectedSocialImage]);
    expect(result.metadataBase?.href).toBe(mockAppUrl + "/");
  });

  it("should preserve existing openGraph properties", () => {
    const result = createMetadataDefaults({
      openGraph: {
        type: "article" as const,
        locale: "fr_FR",
        images: "https://custom.com/image.jpg",
      },
    });

    expect((result.openGraph as OpenGraphMetadata)?.type).toBe("article");
    expect(result.openGraph?.locale).toBe("fr_FR");
    expect(result.openGraph?.images).toBe("https://custom.com/image.jpg");
  });

  it("should preserve existing twitter properties", () => {
    const result = createMetadataDefaults({
      twitter: {
        card: "summary" as const,
        creator: "@customcreator",
        images: "https://custom.com/twitter-image.jpg",
      },
    });

    expect((result.twitter as Record<string, unknown>)?.card).toBe("summary");
    expect(result.twitter?.creator).toBe("@customcreator");
    expect(result.twitter?.images).toBe("https://custom.com/twitter-image.jpg");
  });

  it("should use custom metadataBase when provided", () => {
    const customUrl = new URL("https://custom.example.com");
    const override: Metadata = {
      metadataBase: customUrl,
    };
    const result = createMetadataDefaults(override);

    expect(result.metadataBase).toBe(customUrl);
  });

  it("should preserve supported top-level defaults", () => {
    const override: Metadata = {
      robots: "index,follow",
    };
    const result = createMetadataDefaults(override);

    expect(result.robots).toBe("index,follow");
  });

  it("should set correct default openGraph properties", () => {
    const result = createMetadataDefaults();

    expect(result.openGraph?.url).toBeUndefined();
    expect(result.openGraph?.siteName).toBe(expectedAppName);
    expect((result.openGraph as Record<string, unknown>)?.type).toBe("website");
    expect(result.openGraph?.locale).toBe("en_US");
    expect(result.openGraph?.alternateLocale).toEqual(["zh_CN"]);
  });

  it("should set correct default twitter card properties", () => {
    const result = createMetadataDefaults();

    expect((result.twitter as Record<string, unknown>)?.card).toBe(
      "summary_large_image",
    );
    expect(result.twitter?.creator).toBe(mockTwitterAccount);
  });

  it("should reuse canonical as the default openGraph url", () => {
    const result = createMetadataDefaults({
      alternates: {
        canonical: "/pricing",
      },
    });

    expect(result.openGraph?.url).toBe("/pricing");
  });
});

describe("createLocalizedAlternates", () => {
  it("creates locale-aware canonical and hreflang entries", () => {
    const result = createLocalizedAlternates("/pricing", "zh-Hans");

    expect(result).toEqual({
      canonical: "/zh-Hans/pricing",
      languages: {
        en: "/pricing",
        "zh-Hans": "/zh-Hans/pricing",
        "x-default": "/pricing",
      },
    });
  });
});
