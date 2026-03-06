import { describe, expect, it } from "@jest/globals";
import { assertTrustedBillingUrl, getSafeBillingRedirectUrl } from "./url";

describe("billing url helpers", () => {
  describe("assertTrustedBillingUrl", () => {
    it("accepts trusted https billing hosts", () => {
      expect(
        assertTrustedBillingUrl("https://creem.io/checkout", "redirect"),
      ).toBe("https://creem.io/checkout");
      expect(
        assertTrustedBillingUrl(
          "https://checkout.creem.io/session/123",
          "redirect",
        ),
      ).toBe("https://checkout.creem.io/session/123");
    });

    it("rejects invalid, untrusted, or non-https urls", () => {
      expect(() => assertTrustedBillingUrl("not-a-url", "redirect")).toThrow(
        "Invalid redirect.",
      );
      expect(() =>
        assertTrustedBillingUrl("http://creem.io/checkout", "redirect"),
      ).toThrow("Invalid redirect.");
      expect(() =>
        assertTrustedBillingUrl("https://evil-creem.io/checkout", "redirect"),
      ).toThrow("Invalid redirect.");
    });
  });

  describe("getSafeBillingRedirectUrl", () => {
    it("returns trusted https billing urls", () => {
      expect(
        getSafeBillingRedirectUrl("https://checkout.creem.io/session/123"),
      ).toBe("https://checkout.creem.io/session/123");
    });

    it("allows same-origin redirects when current location matches", () => {
      expect(
        getSafeBillingRedirectUrl("http://localhost:3000/dashboard/billing", {
          protocol: "http:",
          hostname: "localhost",
        }),
      ).toBe("http://localhost:3000/dashboard/billing");
    });

    it("rejects empty, invalid, insecure, and untrusted urls", () => {
      expect(getSafeBillingRedirectUrl("")).toBeNull();
      expect(getSafeBillingRedirectUrl(null)).toBeNull();
      expect(getSafeBillingRedirectUrl("not-a-url")).toBeNull();
      expect(
        getSafeBillingRedirectUrl("http://checkout.creem.io/session/123"),
      ).toBeNull();
      expect(
        getSafeBillingRedirectUrl("https://example.com/billing"),
      ).toBeNull();
    });
  });
});
