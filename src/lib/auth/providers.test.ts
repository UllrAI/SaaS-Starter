import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  beforeAll,
} from "@jest/globals";

// Mock environment variables
const mockEnv = {
  GOOGLE_CLIENT_ID: undefined as string | undefined,
  GOOGLE_CLIENT_SECRET: undefined as string | undefined,
  GITHUB_CLIENT_ID: undefined as string | undefined,
  GITHUB_CLIENT_SECRET: undefined as string | undefined,
  LINKEDIN_CLIENT_ID: undefined as string | undefined,
  LINKEDIN_CLIENT_SECRET: undefined as string | undefined,
};

jest.mock("@/env", () => mockEnv);

type SocialProvider = "google" | "github" | "linkedin";

// Use dynamic imports to avoid ES module issues
let providersModule: typeof import("./providers");

describe("Auth Providers", () => {
  beforeAll(async () => {
    providersModule = await import("./providers");
  });

  beforeEach(() => {
    // Reset all environment variables
    mockEnv.GOOGLE_CLIENT_ID = undefined;
    mockEnv.GOOGLE_CLIENT_SECRET = undefined;
    mockEnv.GITHUB_CLIENT_ID = undefined;
    mockEnv.GITHUB_CLIENT_SECRET = undefined;
    mockEnv.LINKEDIN_CLIENT_ID = undefined;
    mockEnv.LINKEDIN_CLIENT_SECRET = undefined;
  });

  describe("providerConfigs", () => {
    it("should export provider configurations with correct structure", () => {
      expect(Array.isArray(providersModule.providerConfigs)).toBe(true);
      expect(providersModule.providerConfigs).toHaveLength(3);
    });

    it("should contain Google provider configuration", () => {
      const googleConfig = providersModule.providerConfigs.find(
        (config) => config.name === "google",
      );
      expect(googleConfig).toEqual({
        name: "google",
        clientIdKey: "GOOGLE_CLIENT_ID",
        clientSecretKey: "GOOGLE_CLIENT_SECRET",
      });
    });

    it("should contain GitHub provider configuration", () => {
      const githubConfig = providersModule.providerConfigs.find(
        (config) => config.name === "github",
      );
      expect(githubConfig).toEqual({
        name: "github",
        clientIdKey: "GITHUB_CLIENT_ID",
        clientSecretKey: "GITHUB_CLIENT_SECRET",
      });
    });

    it("should contain LinkedIn provider configuration", () => {
      const linkedinConfig = providersModule.providerConfigs.find(
        (config) => config.name === "linkedin",
      );
      expect(linkedinConfig).toEqual({
        name: "linkedin",
        clientIdKey: "LINKEDIN_CLIENT_ID",
        clientSecretKey: "LINKEDIN_CLIENT_SECRET",
      });
    });

    it("should have unique provider names", () => {
      const names = providersModule.providerConfigs.map(
        (config) => config.name,
      );
      const uniqueNames = [...new Set(names)];
      expect(names).toHaveLength(uniqueNames.length);
    });

    it("should have unique client ID keys", () => {
      const clientIdKeys = providersModule.providerConfigs.map(
        (config) => config.clientIdKey,
      );
      const uniqueClientIdKeys = [...new Set(clientIdKeys)];
      expect(clientIdKeys).toHaveLength(uniqueClientIdKeys.length);
    });

    it("should have unique client secret keys", () => {
      const clientSecretKeys = providersModule.providerConfigs.map(
        (config) => config.clientSecretKey,
      );
      const uniqueClientSecretKeys = [...new Set(clientSecretKeys)];
      expect(clientSecretKeys).toHaveLength(uniqueClientSecretKeys.length);
    });
  });

  describe("getAvailableSocialProviders", () => {
    it("should return empty array when no providers are configured", () => {
      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual([]);
    });

    it("should return Google when only Google is configured", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual(["google"]);
    });

    it("should return GitHub when only GitHub is configured", () => {
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual(["github"]);
    });

    it("should return LinkedIn when only LinkedIn is configured", () => {
      mockEnv.LINKEDIN_CLIENT_ID = "linkedin-client-id";
      mockEnv.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual(["linkedin"]);
    });

    it("should return multiple providers when multiple are configured", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual(["google", "github"]);
    });

    it("should return all providers when all are configured", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";
      mockEnv.LINKEDIN_CLIENT_ID = "linkedin-client-id";
      mockEnv.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual(["google", "github", "linkedin"]);
    });

    it("should not return provider when only CLIENT_ID is configured", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      // No CLIENT_SECRET

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual([]);
    });

    it("should not return provider when only CLIENT_SECRET is configured", () => {
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      // No CLIENT_ID

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual([]);
    });

    it("should handle empty string values as unavailable", () => {
      mockEnv.GOOGLE_CLIENT_ID = "";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual([]);
    });

    it("should handle null values as unavailable", () => {
      mockEnv.GOOGLE_CLIENT_ID = null as unknown as string;
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      expect(result).toEqual([]);
    });

    it("should maintain provider order from configuration", () => {
      // Configure providers in reverse order
      mockEnv.LINKEDIN_CLIENT_ID = "linkedin-client-id";
      mockEnv.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      const result = providersModule.getAvailableSocialProviders();
      // Should maintain original config order: google, github, linkedin
      expect(result).toEqual(["google", "github", "linkedin"]);
    });
  });

  describe("isSocialProviderAvailable", () => {
    it("should return false when provider is not available", () => {
      expect(providersModule.isSocialProviderAvailable("google")).toBe(false);
      expect(providersModule.isSocialProviderAvailable("github")).toBe(false);
      expect(providersModule.isSocialProviderAvailable("linkedin")).toBe(false);
    });

    it("should return true when provider is available", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      expect(providersModule.isSocialProviderAvailable("google")).toBe(true);
      expect(providersModule.isSocialProviderAvailable("github")).toBe(false);
      expect(providersModule.isSocialProviderAvailable("linkedin")).toBe(false);
    });

    it("should return true for multiple available providers", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";

      expect(providersModule.isSocialProviderAvailable("google")).toBe(true);
      expect(providersModule.isSocialProviderAvailable("github")).toBe(true);
      expect(providersModule.isSocialProviderAvailable("linkedin")).toBe(false);
    });

    it("should return false for partially configured providers", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      // No CLIENT_SECRET

      expect(providersModule.isSocialProviderAvailable("google")).toBe(false);
    });

    it("should handle all valid provider types", () => {
      const providers: SocialProvider[] = ["google", "github", "linkedin"];

      providers.forEach((provider) => {
        expect(typeof providersModule.isSocialProviderAvailable(provider)).toBe(
          "boolean",
        );
      });
    });
  });

  describe("getAvailableSocialProvidersCount", () => {
    it("should return 0 when no providers are available", () => {
      expect(providersModule.getAvailableSocialProvidersCount()).toBe(0);
    });

    it("should return 1 when one provider is available", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      expect(providersModule.getAvailableSocialProvidersCount()).toBe(1);
    });

    it("should return 2 when two providers are available", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";

      expect(providersModule.getAvailableSocialProvidersCount()).toBe(2);
    });

    it("should return 3 when all providers are available", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";
      mockEnv.LINKEDIN_CLIENT_ID = "linkedin-client-id";
      mockEnv.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

      expect(providersModule.getAvailableSocialProvidersCount()).toBe(3);
    });

    it("should not count partially configured providers", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      // No GITHUB_CLIENT_SECRET

      expect(providersModule.getAvailableSocialProvidersCount()).toBe(1);
    });

    it("should be consistent with getAvailableSocialProviders length", () => {
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      mockEnv.LINKEDIN_CLIENT_ID = "linkedin-client-id";
      mockEnv.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";

      const providers = providersModule.getAvailableSocialProviders();
      const count = providersModule.getAvailableSocialProvidersCount();

      expect(count).toBe(providers.length);
    });
  });

  describe("Integration Tests", () => {
    it("should have consistent behavior across all functions", () => {
      // Test scenario: Only Google configured
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";

      const availableProviders = providersModule.getAvailableSocialProviders();
      const count = providersModule.getAvailableSocialProvidersCount();
      const isGoogleAvailable =
        providersModule.isSocialProviderAvailable("google");
      const isGithubAvailable =
        providersModule.isSocialProviderAvailable("github");

      expect(availableProviders).toEqual(["google"]);
      expect(count).toBe(1);
      expect(isGoogleAvailable).toBe(true);
      expect(isGithubAvailable).toBe(false);
    });

    it("should handle dynamic environment changes", () => {
      // Initially no providers
      expect(providersModule.getAvailableSocialProvidersCount()).toBe(0);

      // Add Google
      mockEnv.GOOGLE_CLIENT_ID = "google-client-id";
      mockEnv.GOOGLE_CLIENT_SECRET = "google-client-secret";
      expect(providersModule.getAvailableSocialProvidersCount()).toBe(1);

      // Add GitHub
      mockEnv.GITHUB_CLIENT_ID = "github-client-id";
      mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";
      expect(providersModule.getAvailableSocialProvidersCount()).toBe(2);

      // Remove Google
      mockEnv.GOOGLE_CLIENT_ID = undefined;
      mockEnv.GOOGLE_CLIENT_SECRET = undefined;
      expect(providersModule.getAvailableSocialProvidersCount()).toBe(1);
      expect(providersModule.getAvailableSocialProviders()).toEqual(["github"]);
    });
  });

  describe("Type Safety", () => {
    it("should only accept valid SocialProvider types", () => {
      const validProviders: SocialProvider[] = ["google", "github", "linkedin"];

      validProviders.forEach((provider) => {
        expect(() =>
          providersModule.isSocialProviderAvailable(provider),
        ).not.toThrow();
      });
    });

    it("should return correct types from functions", () => {
      const providers = providersModule.getAvailableSocialProviders();
      const count = providersModule.getAvailableSocialProvidersCount();
      const isAvailable = providersModule.isSocialProviderAvailable("google");

      expect(Array.isArray(providers)).toBe(true);
      expect(typeof count).toBe("number");
      expect(typeof isAvailable).toBe("boolean");
    });
  });
});
