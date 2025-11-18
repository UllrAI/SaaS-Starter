import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe("Constants Configuration", () => {
  afterEach(() => {
    // Restore original NODE_ENV after each test
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe("Environment-dependent constants", () => {
    beforeEach(() => {
      // Clear module cache to force re-evaluation of constants
      jest.resetModules();
    });

    it("should set APP_NAME for development environment", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
        configurable: true,
      });
      const { APP_NAME } = await import("./constants");
      expect(APP_NAME).toBe("DEV - SaaS Starter");
    });

    it("should set APP_NAME for production environment", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });
      const { APP_NAME } = await import("./constants");
      expect(APP_NAME).toBe("SaaS Starter");
    });

    it("should set APP_NAME for test environment", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });
      const { APP_NAME } = await import("./constants");
      expect(APP_NAME).toBe("SaaS Starter");
    });

    it("should set APP_NAME for undefined environment", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const { APP_NAME } = await import("./constants");
      expect(APP_NAME).toBe("SaaS Starter");
    });
  });

  describe("Static constants", () => {
    it("should export correct brand configuration", async () => {
      const constants = await import("./constants");

      expect(constants.COMPANY_NAME).toBe("UllrAI Lab");
    });

    it("should export correct trial configuration", async () => {
      const { TRIAL_DAYS } = await import("./constants");
      expect(TRIAL_DAYS).toBe(7);
      expect(typeof TRIAL_DAYS).toBe("number");
    });

    it("should export correct avatar configuration", async () => {
      const { AVATAR_STYLE } = await import("./constants");
      expect(AVATAR_STYLE).toBe("adventurer-neutral");
      expect(typeof AVATAR_STYLE).toBe("string");
    });

    it("should export correct contact information", async () => {
      const constants = await import("./constants");

      expect(constants.CONTACT_EMAIL).toBe("support@ullrai.com");
      expect(constants.LEGAL_EMAIL).toBe("legal@ullrai.com");
      expect(constants.PRIVACY_EMAIL).toBe("privacy@ullrai.com");
      expect(constants.RESEND_EMAIL_FROM).toBe("noreply@mail.ullrai.com");

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(constants.CONTACT_EMAIL)).toBe(true);
      expect(emailRegex.test(constants.LEGAL_EMAIL)).toBe(true);
      expect(emailRegex.test(constants.PRIVACY_EMAIL)).toBe(true);
      expect(emailRegex.test(constants.RESEND_EMAIL_FROM)).toBe(true);
    });

    it("should export correct external links", async () => {
      const constants = await import("./constants");

      expect(constants.GITHUB_URL).toBe(
        "https://github.com/ullrai/saas-starter",
      );
      expect(constants.VERCEL_DEPLOY_URL).toBe(
        "https://vercel.com/new/clone?repository-url=https://github.com/ullrai/saas-starter",
      );

      // Validate URL format
      const urlRegex = /^https?:\/\/.+/;
      expect(urlRegex.test(constants.GITHUB_URL)).toBe(true);
      expect(urlRegex.test(constants.VERCEL_DEPLOY_URL)).toBe(true);
    });

    it("should export correct payment configuration", async () => {
      const { PAYMENT_PROVIDER } = await import("./constants");
      expect(PAYMENT_PROVIDER).toBe("creem");
      expect(typeof PAYMENT_PROVIDER).toBe("string");
    });

    it("should export correct SEO configuration", async () => {
      const constants = await import("./constants");

      expect(constants.OGIMAGE).toBe("https://starter.ullrai.com/og.png");
      expect(constants.TWITTERACCOUNT).toBe("@ullr_ai");

      // Validate URL format for OG image
      const urlRegex = /^https?:\/\/.+/;
      expect(urlRegex.test(constants.OGIMAGE)).toBe(true);

      // Validate Twitter handle format
      expect(constants.TWITTERACCOUNT.startsWith("@")).toBe(true);
    });
  });

  describe("Constants types and immutability", () => {
    it("should have correct types for all constants", async () => {
      const constants = await import("./constants");

      expect(typeof constants.APP_NAME).toBe("string");
      expect(typeof constants.COMPANY_NAME).toBe("string");
      expect(typeof constants.TRIAL_DAYS).toBe("number");
      expect(typeof constants.AVATAR_STYLE).toBe("string");
      expect(typeof constants.CONTACT_EMAIL).toBe("string");
      expect(typeof constants.LEGAL_EMAIL).toBe("string");
      expect(typeof constants.PRIVACY_EMAIL).toBe("string");
      expect(typeof constants.RESEND_EMAIL_FROM).toBe("string");
      expect(typeof constants.GITHUB_URL).toBe("string");
      expect(typeof constants.VERCEL_DEPLOY_URL).toBe("string");
      expect(typeof constants.PAYMENT_PROVIDER).toBe("string");
      expect(typeof constants.OGIMAGE).toBe("string");
      expect(typeof constants.TWITTERACCOUNT).toBe("string");
    });

    it("should not have empty or null values", async () => {
      const constants = await import("./constants");

      const allConstants = [
        constants.APP_NAME,
        constants.COMPANY_NAME,
        constants.AVATAR_STYLE,
        constants.CONTACT_EMAIL,
        constants.LEGAL_EMAIL,
        constants.PRIVACY_EMAIL,
        constants.RESEND_EMAIL_FROM,
        constants.GITHUB_URL,
        constants.VERCEL_DEPLOY_URL,
        constants.PAYMENT_PROVIDER,
        constants.OGIMAGE,
        constants.TWITTERACCOUNT,
      ];

      allConstants.forEach((constant) => {
        expect(constant).toBeDefined();
        expect(constant).not.toBeNull();
        if (typeof constant === "string") {
          expect(constant.length).toBeGreaterThan(0);
        }
      });

      expect(constants.TRIAL_DAYS).toBeGreaterThan(0);
    });

    it("should have valid values for domain-specific constants", async () => {
      const constants = await import("./constants");

      // Trial days should be a reasonable value
      expect(constants.TRIAL_DAYS).toBeGreaterThanOrEqual(1);
      expect(constants.TRIAL_DAYS).toBeLessThanOrEqual(365);

      // Payment provider should be supported
      expect(["creem", "stripe"].includes(constants.PAYMENT_PROVIDER)).toBe(
        true,
      );

      // Avatar style should be a valid DiceBear style
      expect(constants.AVATAR_STYLE).toMatch(/^[a-z-]+$/);

      // Company name should be properly formatted
      expect(constants.COMPANY_NAME).not.toMatch(/^\s|\s$/); // No leading/trailing spaces

      // URLs should start with https
      expect(constants.GITHUB_URL.startsWith("https://")).toBe(true);
      expect(constants.VERCEL_DEPLOY_URL.startsWith("https://")).toBe(true);
      expect(constants.OGIMAGE.startsWith("https://")).toBe(true);
    });
  });

  describe("Configuration consistency", () => {
    it("should have consistent branding across constants", async () => {
      const constants = await import("./constants");

      // Both GitHub URL and Vercel URL should reference the same repository
      expect(constants.GITHUB_URL).toContain("ullrai/saas-starter");
      expect(constants.VERCEL_DEPLOY_URL).toContain("ullrai/saas-starter");

      // All emails should be from ullrai.com domain
      expect(constants.CONTACT_EMAIL).toContain("ullrai.com");
      expect(constants.LEGAL_EMAIL).toContain("ullrai.com");
      expect(constants.PRIVACY_EMAIL).toContain("ullrai.com");
      expect(constants.RESEND_EMAIL_FROM).toContain("ullrai.com");

      // Company name should be consistent with domain
      expect(constants.COMPANY_NAME).toContain("UllrAI");
      expect(constants.TWITTERACCOUNT).toContain("ullr");
    });

    it("should have APP_NAME that includes base name", async () => {
      const constants = await import("./constants");

      expect(constants.APP_NAME).toContain("SaaS Starter");

      if (process.env.NODE_ENV === "development") {
        expect(constants.APP_NAME).toContain("DEV");
      }
    });

  });
});
