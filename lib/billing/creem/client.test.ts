import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock Creem client
const mockCreemInstance = {
  config: {
    serverIdx: 0,
  },
  // Add other Creem methods that might be used
  createPayment: jest.fn(),
  getPayment: jest.fn(),
  cancelPayment: jest.fn(),
};

const mockCreemConstructor = jest.fn(() => mockCreemInstance);

// Mock environment variables with default values
const mockEnv = {
  CREEM_API_KEY: "creem_api_key_test_12345",
  CREEM_ENVIRONMENT: "test_mode",
  CREEM_WEBHOOK_SECRET: "creem_webhook_secret_test_67890",
};

// Setup mocks before imports
jest.mock("creem", () => ({
  Creem: mockCreemConstructor,
}));

jest.mock("@/env", () => mockEnv);

describe("Creem Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock environment to default values
    mockEnv.CREEM_API_KEY = "creem_api_key_test_12345";
    mockEnv.CREEM_ENVIRONMENT = "test_mode";
    mockEnv.CREEM_WEBHOOK_SECRET = "creem_webhook_secret_test_67890";
    
    // Reset mock constructor behavior
    mockCreemConstructor.mockReturnValue(mockCreemInstance);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Module Initialization", () => {
    it("should initialize Creem client with test mode configuration", async () => {
      // Reset modules to force re-import with current mock values
      jest.resetModules();
      
      const clientModule = await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // test_mode should use serverIdx 1
      });
      
      expect(clientModule.creemClient).toBe(mockCreemInstance);
    });

    it("should initialize Creem client with live mode configuration", async () => {
      mockEnv.CREEM_ENVIRONMENT = "live_mode";
      
      jest.resetModules();
      const clientModule = await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 0, // live_mode should use serverIdx 0
      });
      
      expect(clientModule.creemClient).toBe(mockCreemInstance);
    });

    it("should use test mode for unknown environment values", async () => {
      mockEnv.CREEM_ENVIRONMENT = "unknown_mode";
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // unknown values should default to test mode
      });
    });

    it("should use test mode when CREEM_ENVIRONMENT is undefined", async () => {
      delete (mockEnv as any).CREEM_ENVIRONMENT;
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // undefined should default to test mode
      });
    });

    it("should use test mode when CREEM_ENVIRONMENT is empty string", async () => {
      mockEnv.CREEM_ENVIRONMENT = "";
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // empty string should default to test mode
      });
    });
  });

  describe("Environment Variable Validation", () => {
    it("should throw error when CREEM_API_KEY is not set", async () => {
      delete (mockEnv as any).CREEM_API_KEY;
      
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
    });

    it("should throw error when CREEM_API_KEY is empty string", async () => {
      mockEnv.CREEM_API_KEY = "";
      
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
    });

    it("should throw error when CREEM_API_KEY is null", async () => {
      (mockEnv as any).CREEM_API_KEY = null;
      
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
    });

    it("should throw error when CREEM_API_KEY is undefined", async () => {
      (mockEnv as any).CREEM_API_KEY = undefined;
      
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
    });

    it("should accept valid CREEM_API_KEY", async () => {
      mockEnv.CREEM_API_KEY = "valid_api_key_123";
      
      jest.resetModules();
      
      await expect(import("./client")).resolves.not.toThrow();
    });
  });

  describe("Exported Values", () => {
    it("should export creemClient instance", async () => {
      jest.resetModules();
      const { creemClient } = await import("./client");
      
      expect(creemClient).toBe(mockCreemInstance);
      expect(creemClient).toBeDefined();
    });

    it("should export creemApiKey from environment", async () => {
      const testApiKey = "test_api_key_456";
      mockEnv.CREEM_API_KEY = testApiKey;
      
      jest.resetModules();
      const { creemApiKey } = await import("./client");
      
      expect(creemApiKey).toBe(testApiKey);
    });

    it("should export creemWebhookSecret from environment", async () => {
      const testWebhookSecret = "test_webhook_secret_789";
      mockEnv.CREEM_WEBHOOK_SECRET = testWebhookSecret;
      
      jest.resetModules();
      const { creemWebhookSecret } = await import("./client");
      
      expect(creemWebhookSecret).toBe(testWebhookSecret);
    });

    it("should handle undefined webhook secret", async () => {
      delete (mockEnv as any).CREEM_WEBHOOK_SECRET;
      
      jest.resetModules();
      const { creemWebhookSecret } = await import("./client");
      
      expect(creemWebhookSecret).toBeUndefined();
    });

    it("should handle empty webhook secret", async () => {
      mockEnv.CREEM_WEBHOOK_SECRET = "";
      
      jest.resetModules();
      const { creemWebhookSecret } = await import("./client");
      
      expect(creemWebhookSecret).toBe("");
    });
  });

  describe("Server Index Logic", () => {
    it("should use serverIdx 0 for live_mode", async () => {
      mockEnv.CREEM_ENVIRONMENT = "live_mode";
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 0,
      });
    });

    it("should use serverIdx 1 for test_mode", async () => {
      mockEnv.CREEM_ENVIRONMENT = "test_mode";
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1,
      });
    });

    it("should use serverIdx 1 for any non-live_mode value", async () => {
      const nonLiveModeValues = [
        "test_mode",
        "development",
        "staging",
        "prod",
        "production",
        "demo",
        "sandbox",
        "preview",
        "",
        null,
        undefined,
        123,
        true,
        false,
      ];

      for (const value of nonLiveModeValues) {
        (mockEnv as any).CREEM_ENVIRONMENT = value;
        
        jest.resetModules();
        await import("./client");
        
        expect(mockCreemConstructor).toHaveBeenCalledWith({
          serverIdx: 1,
        });
      }
    });

    it("should be case sensitive for live_mode", async () => {
      const caseSensitiveValues = [
        "Live_Mode",
        "LIVE_MODE",
        "live_Mode",
        "Live_mode",
        " live_mode",
        "live_mode ",
        "live-mode",
        "livemode",
      ];

      for (const value of caseSensitiveValues) {
        mockEnv.CREEM_ENVIRONMENT = value;
        
        jest.resetModules();
        await import("./client");
        
        expect(mockCreemConstructor).toHaveBeenCalledWith({
          serverIdx: 1, // Should default to test mode for non-exact matches
        });
      }
    });
  });

  describe("Integration Tests", () => {
    it("should properly configure client for production environment", async () => {
      mockEnv.CREEM_API_KEY = "live_api_key_prod_123";
      mockEnv.CREEM_ENVIRONMENT = "live_mode";
      mockEnv.CREEM_WEBHOOK_SECRET = "live_webhook_secret_456";
      
      jest.resetModules();
      const { creemClient, creemApiKey, creemWebhookSecret } = await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 0, // live mode
      });
      expect(creemClient).toBe(mockCreemInstance);
      expect(creemApiKey).toBe("live_api_key_prod_123");
      expect(creemWebhookSecret).toBe("live_webhook_secret_456");
    });

    it("should properly configure client for development environment", async () => {
      mockEnv.CREEM_API_KEY = "test_api_key_dev_789";
      mockEnv.CREEM_ENVIRONMENT = "test_mode";
      mockEnv.CREEM_WEBHOOK_SECRET = "test_webhook_secret_012";
      
      jest.resetModules();
      const { creemClient, creemApiKey, creemWebhookSecret } = await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // test mode
      });
      expect(creemClient).toBe(mockCreemInstance);
      expect(creemApiKey).toBe("test_api_key_dev_789");
      expect(creemWebhookSecret).toBe("test_webhook_secret_012");
    });

    it("should handle minimal configuration", async () => {
      mockEnv.CREEM_API_KEY = "minimal_api_key";
      delete (mockEnv as any).CREEM_ENVIRONMENT;
      delete (mockEnv as any).CREEM_WEBHOOK_SECRET;
      
      jest.resetModules();
      const { creemClient, creemApiKey, creemWebhookSecret } = await import("./client");
      
      expect(mockCreemConstructor).toHaveBeenCalledWith({
        serverIdx: 1, // defaults to test mode
      });
      expect(creemClient).toBe(mockCreemInstance);
      expect(creemApiKey).toBe("minimal_api_key");
      expect(creemWebhookSecret).toBeUndefined();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle Creem constructor errors", async () => {
      const constructorError = new Error("Creem initialization failed");
      mockCreemConstructor.mockImplementation(() => {
        throw constructorError;
      });
      
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow("Creem initialization failed");
    });

    it("should propagate validation errors before Creem instantiation", async () => {
      delete (mockEnv as any).CREEM_API_KEY;
      
      // Ensure Creem constructor is never called when validation fails
      jest.resetModules();
      
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
      
      expect(mockCreemConstructor).not.toHaveBeenCalled();
    });
  });

  describe("Module Loading Behavior", () => {
    it("should maintain same exports across multiple imports", async () => {
      jest.resetModules();
      const import1 = await import("./client");
      const import2 = await import("./client");
      
      expect(import1.creemClient).toBe(import2.creemClient);
      expect(import1.creemApiKey).toBe(import2.creemApiKey);
      expect(import1.creemWebhookSecret).toBe(import2.creemWebhookSecret);
    });

    it("should re-initialize after module reset", async () => {
      jest.resetModules();
      await import("./client");
      
      const firstCallCount = mockCreemConstructor.mock.calls.length;
      
      jest.resetModules();
      await import("./client");
      
      expect(mockCreemConstructor.mock.calls.length).toBe(firstCallCount + 1);
    });

    it("should validate environment variables on each import", async () => {
      // First import with valid API key
      mockEnv.CREEM_API_KEY = "valid_key";
      jest.resetModules();
      await expect(import("./client")).resolves.not.toThrow();
      
      // Second import with invalid API key
      delete (mockEnv as any).CREEM_API_KEY;
      jest.resetModules();
      await expect(import("./client")).rejects.toThrow(
        "CREEM_API_KEY environment variable is not set."
      );
    });
  });

  describe("Environment Variable Edge Cases", () => {
    it("should handle various falsy values for CREEM_API_KEY", async () => {
      const falsyValues = ["", null, undefined, 0, false];
      
      for (const value of falsyValues) {
        (mockEnv as any).CREEM_API_KEY = value;
        
        jest.resetModules();
        
        await expect(import("./client")).rejects.toThrow(
          "CREEM_API_KEY environment variable is not set."
        );
      }
    });

    it("should accept various truthy values for CREEM_API_KEY", async () => {
      const truthyValues = [
        "valid_key",
        "key_123",
        "creem_live_key_abc",
        "test_key",
        "1",
        "true",
        " key_with_spaces ",
      ];
      
      for (const value of truthyValues) {
        mockEnv.CREEM_API_KEY = value;
        
        jest.resetModules();
        
        await expect(import("./client")).resolves.not.toThrow();
        
        const { creemApiKey } = await import("./client");
        expect(creemApiKey).toBe(value);
      }
    });

    it("should handle special characters in environment variables", async () => {
      mockEnv.CREEM_API_KEY = "key_with_!@#$%^&*()_+-=[]{}|;:,.<>?";
      mockEnv.CREEM_WEBHOOK_SECRET = "secret_with_!@#$%^&*()_+-=[]{}|;:,.<>?";
      
      jest.resetModules();
      const { creemApiKey, creemWebhookSecret } = await import("./client");
      
      expect(creemApiKey).toBe("key_with_!@#$%^&*()_+-=[]{}|;:,.<>?");
      expect(creemWebhookSecret).toBe("secret_with_!@#$%^&*()_+-=[]{}|;:,.<>?");
    });

    it("should handle unicode characters in environment variables", async () => {
      mockEnv.CREEM_API_KEY = "key_测试_🔑_émoji";
      mockEnv.CREEM_WEBHOOK_SECRET = "secret_测试_🔐_émoji";
      
      jest.resetModules();
      const { creemApiKey, creemWebhookSecret } = await import("./client");
      
      expect(creemApiKey).toBe("key_测试_🔑_émoji");
      expect(creemWebhookSecret).toBe("secret_测试_🔐_émoji");
    });
  });

  describe("Configuration Consistency", () => {
    it("should maintain consistent configuration between imports", async () => {
      mockEnv.CREEM_API_KEY = "consistent_key";
      mockEnv.CREEM_ENVIRONMENT = "live_mode";
      mockEnv.CREEM_WEBHOOK_SECRET = "consistent_secret";
      
      jest.resetModules();
      const firstImport = await import("./client");
      const secondImport = await import("./client");
      
      expect(firstImport.creemApiKey).toBe(secondImport.creemApiKey);
      expect(firstImport.creemWebhookSecret).toBe(secondImport.creemWebhookSecret);
      expect(firstImport.creemClient).toBe(secondImport.creemClient);
    });

    it("should reflect environment changes after module reset", async () => {
      // Initial configuration
      mockEnv.CREEM_API_KEY = "initial_key";
      mockEnv.CREEM_ENVIRONMENT = "test_mode";
      
      jest.resetModules();
      const { creemApiKey: key1 } = await import("./client");
      expect(key1).toBe("initial_key");
      expect(mockCreemConstructor).toHaveBeenLastCalledWith({ serverIdx: 1 });
      
      // Changed configuration
      mockEnv.CREEM_API_KEY = "changed_key";
      mockEnv.CREEM_ENVIRONMENT = "live_mode";
      
      jest.resetModules();
      const { creemApiKey: key2 } = await import("./client");
      expect(key2).toBe("changed_key");
      expect(mockCreemConstructor).toHaveBeenLastCalledWith({ serverIdx: 0 });
    });
  });
});