import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock environment
const mockEnv = {
  NEXT_PUBLIC_APP_URL: "https://example.com",
};

// Mock better-auth modules
const mockCreateAuthClient = jest.fn();
const mockMagicLinkClient = jest.fn(() => ({}));
const mockInferAdditionalFields = jest.fn(() => ({}));

jest.mock("@/env", () => ({
  __esModule: true,
  default: mockEnv,
}));

jest.mock("better-auth/react", () => ({
  createAuthClient: mockCreateAuthClient,
}));

jest.mock("better-auth/client/plugins", () => ({
  magicLinkClient: mockMagicLinkClient,
  inferAdditionalFields: mockInferAdditionalFields,
}));

// Mock auth server types
jest.mock("./server", () => ({
  auth: {},
}));

describe("Auth Client", () => {
  // Mock the return value of createAuthClient once
  const mockAuthClient = {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    revokeSession: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    magicLink: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
    sendVerificationEmail: jest.fn(),
    changeEmail: jest.fn(),
    deleteUser: jest.fn(),
    linkSocial: jest.fn(),
    useSession: jest.fn(),
    verifyEmail: jest.fn(),
    listAccounts: jest.fn(),
    listSessions: jest.fn(),
    revokeOtherSessions: jest.fn(),
    revokeSessions: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCreateAuthClient.mockReturnValue(mockAuthClient);
  });

  it("should create auth client with correct configuration", async () => {
    // Import the module to trigger initialization
    await import("./client");

    expect(mockCreateAuthClient).toHaveBeenCalledWith({
      baseURL: "https://example.com",
      plugins: [
        expect.any(Object), // magicLinkClient result
        expect.any(Object), // inferAdditionalFields result
      ],
    });
  });

  it("should call magicLinkClient plugin", async () => {
    // Import the module to trigger initialization
    await import("./client");

    expect(mockMagicLinkClient).toHaveBeenCalled();
  });

  it("should call inferAdditionalFields plugin", async () => {
    // Import the module to trigger initialization
    await import("./client");

    expect(mockInferAdditionalFields).toHaveBeenCalled();
  });

  it("should export all expected auth methods", async () => {
    const clientModule = await import("./client");

    // Check that all expected exports exist
    const expectedExports = [
      "signIn",
      "signOut",
      "signUp",
      "revokeSession",
      "updateUser",
      "getSession",
      "magicLink",
      "changePassword",
      "resetPassword",
      "sendVerificationEmail",
      "changeEmail",
      "deleteUser",
      "linkSocial",
      "useSession",
      "verifyEmail",
      "listAccounts",
      "listSessions",
      "revokeOtherSessions",
      "revokeSessions",
      "authClient",
    ];

    expectedExports.forEach((exportName) => {
      expect(clientModule).toHaveProperty(exportName);
      expect(
        clientModule[exportName as keyof typeof clientModule],
      ).toBeDefined();
    });
  });

  it("should export authClient instance", async () => {
    const { authClient } = await import("./client");

    expect(authClient).toBeDefined();
    expect(mockCreateAuthClient).toHaveBeenCalled();
  });

  describe("Auth Client Functions", () => {
    let clientModule: typeof import("./client");

    beforeEach(async () => {
      clientModule = await import("./client");
    });

    it("should export signIn function", () => {
      expect(typeof clientModule.signIn).toBe("function");
    });

    it("should export signOut function", () => {
      expect(typeof clientModule.signOut).toBe("function");
    });

    it("should export signUp function", () => {
      expect(typeof clientModule.signUp).toBe("function");
    });

    it("should export getSession function", () => {
      expect(typeof clientModule.getSession).toBe("function");
    });

    it("should export magicLink function", () => {
      expect(typeof clientModule.magicLink).toBe("function");
    });

    it("should export updateUser function", () => {
      expect(typeof clientModule.updateUser).toBe("function");
    });

    it("should export changePassword function", () => {
      expect(typeof clientModule.changePassword).toBe("function");
    });

    it("should export resetPassword function", () => {
      expect(typeof clientModule.resetPassword).toBe("function");
    });

    it("should export deleteUser function", () => {
      expect(typeof clientModule.deleteUser).toBe("function");
    });

    it("should export session management functions", () => {
      expect(typeof clientModule.revokeSession).toBe("function");
      expect(typeof clientModule.listSessions).toBe("function");
      expect(typeof clientModule.revokeOtherSessions).toBe("function");
      expect(typeof clientModule.revokeSessions).toBe("function");
    });

    it("should export email and verification functions", () => {
      expect(typeof clientModule.sendVerificationEmail).toBe("function");
      expect(typeof clientModule.verifyEmail).toBe("function");
      expect(typeof clientModule.changeEmail).toBe("function");
    });

    it("should export social and account functions", () => {
      expect(typeof clientModule.linkSocial).toBe("function");
      expect(typeof clientModule.listAccounts).toBe("function");
    });

    it("should export React hook", () => {
      expect(typeof clientModule.useSession).toBe("function");
    });
  });

  describe("Configuration Validation", () => {
    it("should use environment variable for baseURL", async () => {
      await import("./client");

      expect(mockCreateAuthClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://example.com",
        }),
      );
    });

    it("should include required plugins", async () => {
      await import("./client");

      const callArgs = mockCreateAuthClient.mock.calls[0][0] as {
        plugins: unknown[];
      };
      expect(callArgs.plugins).toHaveLength(2);
      expect(mockMagicLinkClient).toHaveBeenCalled();
      expect(mockInferAdditionalFields).toHaveBeenCalled();
    });
  });
});
