import { describe, it, expect } from "@jest/globals";
import { createMetadata } from "./metadata";
import type { Metadata } from "next/types";

describe("createMetadata", () => {
  // Use the actual values from the global mocks/constants
  const expectedAppName = process.env.NODE_ENV === "development" ? "DEV - SaaS Starter" : "SaaS Starter";
  const mockOGImage = "https://starter.ullrai.com/og.png";
  const mockAppUrl = "http://localhost:3000";
  const mockTwitterAccount = "@ullr_ai";

  it("should create metadata with default values when override is empty", () => {
    const override: Metadata = {};
    const result = createMetadata(override);

    expect(result.openGraph?.title).toBe(expectedAppName);
    expect(result.openGraph?.description).toBe("");
    expect(result.openGraph?.url).toBe(mockAppUrl);
    expect(result.openGraph?.images).toBe(mockOGImage);
    expect(result.openGraph?.siteName).toBe(expectedAppName);
    expect(result.openGraph?.type).toBe("website");
    expect(result.openGraph?.locale).toBe("en_US");
    expect(result.twitter?.card).toBe("summary_large_image");
    expect(result.twitter?.creator).toBe(mockTwitterAccount);
    expect(result.twitter?.title).toBe(expectedAppName);
    expect(result.twitter?.description).toBe("");
    expect(result.twitter?.images).toBe(mockOGImage);
    expect(result.metadataBase?.href).toBe(mockAppUrl + "/");
  });

  it("should use override title when provided as string", () => {
    const override: Metadata = {
      title: "Custom Title",
      description: "Custom description",
    };
    const result = createMetadata(override);

    expect(result.title).toBe("Custom Title");
    expect(result.description).toBe("Custom description");
    expect(result.openGraph?.title).toBe("Custom Title");
    expect(result.openGraph?.description).toBe("Custom description");
    expect(result.twitter?.title).toBe("Custom Title");
    expect(result.twitter?.description).toBe("Custom description");
  });

  it("should handle absolute title template", () => {
    const override: Metadata = {
      title: {
        absolute: "Absolute Title",
      },
    };
    const result = createMetadata(override);

    expect(result.openGraph?.title).toBe("Absolute Title");
    expect(result.twitter?.title).toBe("Absolute Title");
  });

  it("should handle default title template", () => {
    const override: Metadata = {
      title: {
        default: "Default Title",
        template: "%s | App",
      },
    };
    const result = createMetadata(override);

    expect(result.openGraph?.title).toBe("Default Title");
    expect(result.twitter?.title).toBe("Default Title");
  });

  it("should preserve existing openGraph properties", () => {
    const override: Metadata = {
      title: "Custom Title",
      openGraph: {
        title: "Custom OG Title",
        type: "article",
        locale: "fr_FR",
        images: "https://custom.com/image.jpg",
      },
    };
    const result = createMetadata(override);

    expect(result.openGraph?.title).toBe("Custom OG Title");
    expect(result.openGraph?.type).toBe("article");
    expect(result.openGraph?.locale).toBe("fr_FR");
    expect(result.openGraph?.images).toBe("https://custom.com/image.jpg");
  });

  it("should preserve existing twitter properties", () => {
    const override: Metadata = {
      title: "Custom Title",
      twitter: {
        title: "Custom Twitter Title",
        card: "summary",
        creator: "@customcreator",
        images: "https://custom.com/twitter-image.jpg",
      },
    };
    const result = createMetadata(override);

    expect(result.twitter?.title).toBe("Custom Twitter Title");
    expect(result.twitter?.card).toBe("summary");
    expect(result.twitter?.creator).toBe("@customcreator");
    expect(result.twitter?.images).toBe("https://custom.com/twitter-image.jpg");
  });

  it("should use custom metadataBase when provided", () => {
    const customUrl = new URL("https://custom.example.com");
    const override: Metadata = {
      metadataBase: customUrl,
    };
    const result = createMetadata(override);

    expect(result.metadataBase).toBe(customUrl);
  });

  it("should fallback to empty description when not provided", () => {
    const override: Metadata = {
      title: "Title Only",
    };
    const result = createMetadata(override);

    expect(result.openGraph?.description).toBe("");
    expect(result.twitter?.description).toBe("");
  });

  it("should spread all override properties", () => {
    const override: Metadata = {
      title: "Custom Title",
      description: "Custom description",
      keywords: ["test", "metadata"],
      robots: "index,follow",
      viewport: "width=device-width,initial-scale=1",
    };
    const result = createMetadata(override);

    expect(result.title).toBe("Custom Title");
    expect(result.description).toBe("Custom description");
    expect(result.keywords).toEqual(["test", "metadata"]);
    expect(result.robots).toBe("index,follow");
    expect(result.viewport).toBe("width=device-width,initial-scale=1");
  });

  it("should handle complex title object without absolute or default", () => {
    const override: Metadata = {
      title: {
        template: "%s | App",
      },
    };
    const result = createMetadata(override);

    // Should fallback to APP_NAME when no absolute or default is provided
    expect(result.openGraph?.title).toBe(expectedAppName);
    expect(result.twitter?.title).toBe(expectedAppName);
  });

  it("should set correct default openGraph properties", () => {
    const override: Metadata = {
      title: "Test Title",
    };
    const result = createMetadata(override);

    expect(result.openGraph?.url).toBe(mockAppUrl);
    expect(result.openGraph?.siteName).toBe(expectedAppName);
    expect(result.openGraph?.type).toBe("website");
    expect(result.openGraph?.locale).toBe("en_US");
  });

  it("should set correct default twitter card properties", () => {
    const override: Metadata = {
      title: "Test Title",
    };
    const result = createMetadata(override);

    expect(result.twitter?.card).toBe("summary_large_image");
    expect(result.twitter?.creator).toBe(mockTwitterAccount);
  });
});