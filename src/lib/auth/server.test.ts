import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret",
  DATABASE_URL: "postgresql://test",
  RESEND_API_KEY: "test-key",
  CREEM_API_KEY: "test-creem-key",
  CREEM_WEBHOOK_SECRET: "test-webhook-secret",
};

// Mock modules
jest.mock("@/env", () => mockEnv);
jest.mock("@/database", () => ({ db: {} }));
jest.mock("@/database/tables", () => ({}));
jest.mock("@/emails/magic-link", () => ({ sendMagicLink: jest.fn() }));
jest.mock("@/lib/config/constants", () => ({ APP_NAME: "Test App" }));
jest.mock("better-auth/plugins", () => ({
  magicLink: jest.fn(() => ({})),
}));
jest.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: jest.fn(() => ({})),
}));
jest.mock("better-auth", () => ({
  betterAuth: jest.fn((config) => ({ options: config })),
}));

describe("Auth Server Configuration", () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = process.env;
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should include Google provider when both CLIENT_ID and CLIENT_SECRET are provided", async () => {
    // Mock env with Google credentials
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).toHaveProperty("google");
    expect(config.socialProviders.google).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });
  });

  it("should include GitHub provider when both CLIENT_ID and CLIENT_SECRET are provided", async () => {
    // Mock env with GitHub credentials
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: "github-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).toHaveProperty("github");
    expect(config.socialProviders.github).toEqual({
      clientId: "github-client-id",
      clientSecret: "github-client-secret",
    });
  });

  it("should include LinkedIn provider when LinkedIn credentials are provided", async () => {
    // Mock env with LinkedIn credentials
    jest.doMock("@/env", () => ({
      ...mockEnv,
      LINKEDIN_CLIENT_ID: "linkedin-client-id",
      LINKEDIN_CLIENT_SECRET: "linkedin-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).toHaveProperty("linkedin");
    expect(config.socialProviders.linkedin).toEqual({
      clientId: "linkedin-client-id",
      clientSecret: "linkedin-client-secret",
    });
  });

  it("should include all providers when all credentials are provided", async () => {
    // Mock env with Google, GitHub, and LinkedIn credentials
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: "github-client-secret",
      LINKEDIN_CLIENT_ID: "linkedin-client-id",
      LINKEDIN_CLIENT_SECRET: "linkedin-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).toHaveProperty("google");
    expect(config.socialProviders).toHaveProperty("github");
    expect(config.socialProviders).toHaveProperty("linkedin");
    expect(Object.keys(config.socialProviders)).toHaveLength(3);
  });

  it("should not include Google provider when CLIENT_ID is missing", async () => {
    // Mock env with only Google CLIENT_SECRET
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GOOGLE_CLIENT_SECRET: "google-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("google");
  });

  it("should not include Google provider when CLIENT_SECRET is missing", async () => {
    // Mock env with only Google CLIENT_ID
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GOOGLE_CLIENT_ID: "google-client-id",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("google");
  });

  it("should not include GitHub provider when CLIENT_ID is missing", async () => {
    // Mock env with only GitHub CLIENT_SECRET
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GITHUB_CLIENT_SECRET: "github-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("github");
  });

  it("should not include GitHub provider when CLIENT_SECRET is missing", async () => {
    // Mock env with only GitHub CLIENT_ID
    jest.doMock("@/env", () => ({
      ...mockEnv,
      GITHUB_CLIENT_ID: "github-client-id",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("github");
  });

  it("should not include LinkedIn provider when CLIENT_ID is missing", async () => {
    // Mock env with only LinkedIn CLIENT_SECRET
    jest.doMock("@/env", () => ({
      ...mockEnv,
      LINKEDIN_CLIENT_SECRET: "linkedin-client-secret",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("linkedin");
  });

  it("should not include LinkedIn provider when CLIENT_SECRET is missing", async () => {
    // Mock env with only LinkedIn CLIENT_ID
    jest.doMock("@/env", () => ({
      ...mockEnv,
      LINKEDIN_CLIENT_ID: "linkedin-client-id",
    }));

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).not.toHaveProperty("linkedin");
  });

  it("should have empty socialProviders when no credentials are provided", async () => {
    // Mock env without any social provider credentials
    jest.doMock("@/env", () => mockEnv);

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.socialProviders).toEqual({});
    expect(Object.keys(config.socialProviders)).toHaveLength(0);
  });

  it("should maintain other auth configuration properties", async () => {
    jest.doMock("@/env", () => mockEnv);

    const { auth } = await import("./server");
    const config = auth.options;

    expect(config.appName).toBe("Test App");
    expect(config.baseURL).toBe("http://localhost:3000");
    expect(config.secret).toBe("test-secret");
    expect(config.trustedOrigins).toEqual(["http://localhost:3000"]);
    expect(config.session.expiresIn).toBe(60 * 60 * 24 * 30);
  });

  it("should configure magicLink plugin with development console logging", async () => {
    // Set NODE_ENV to development to test the dev console.log path
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    jest.doMock("@/env", () => mockEnv);

    // Mock console.log to track calls
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    try {
      // Re-import to get fresh module with new NODE_ENV
      jest.resetModules();
      const { magicLink } = await import("better-auth/plugins");
      const { sendMagicLink } = await import("@/emails/magic-link");

      const mockRequest = new Request("http://test-url");

      // Mock magicLink to call the provided function
      const mockMagicLinkCall = jest.fn();
      (magicLink as jest.Mock).mockImplementation((config) => {
        // Call the sendMagicLink function to trigger line coverage
        config.sendMagicLink(
          { email: "test@example.com", url: "http://test-url" },
          { request: mockRequest },
        );
        return mockMagicLinkCall;
      });

      await import("./server");

      // Verify console.log was called in development mode
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✨ Magic link: http://test-url",
      );
      expect(sendMagicLink).toHaveBeenCalledWith(
        "test@example.com",
        "http://test-url",
        mockRequest,
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      consoleLogSpy.mockRestore();
    }
  });

  it("should configure magicLink plugin without console logging in production", async () => {
    // Set NODE_ENV to production
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    jest.doMock("@/env", () => mockEnv);

    // Mock console.log to track calls
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    try {
      // Re-import to get fresh module with new NODE_ENV
      jest.resetModules();
      const { magicLink } = await import("better-auth/plugins");
      const { sendMagicLink } = await import("@/emails/magic-link");

      const mockRequest = new Request("http://test-url");

      // Mock magicLink to call the provided function
      const mockMagicLinkCall = jest.fn();
      (magicLink as jest.Mock).mockImplementation((config) => {
        // Call the sendMagicLink function to trigger line coverage
        config.sendMagicLink(
          { email: "test@example.com", url: "http://test-url" },
          { request: mockRequest },
        );
        return mockMagicLinkCall;
      });

      await import("./server");

      // Verify console.log was NOT called in production mode
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(sendMagicLink).toHaveBeenCalledWith(
        "test@example.com",
        "http://test-url",
        mockRequest,
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      consoleLogSpy.mockRestore();
    }
  });
});
