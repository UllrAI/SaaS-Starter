import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock the admin-tables module
const mockEnabledTablesMap = {
  uploads: {},
  sessions: {},
  payments: {},
  subscriptions: {},
  users: {},
  verifications: {},
} as const;

jest.mock("@/lib/config/admin-tables", () => ({
  enabledTablesMap: mockEnabledTablesMap,
}));

// Mock types module
jest.mock("./types", () => ({}));

// Import after mocks are set up
import {
  adminTableConfig,
  getTableConfig,
  isUserRelatedTable,
  getUserRelatedColumn,
} from "./config";

// Mock EnabledTableKeys type
type EnabledTableKeys = keyof typeof mockEnabledTablesMap;

describe("Admin Config Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("adminTableConfig", () => {
    it("should have uploads configuration", () => {
      expect(adminTableConfig.uploads).toBeDefined();
      expect(adminTableConfig.uploads?.userRelated).toBe("userId");
      expect(adminTableConfig.uploads?.hiddenColumns).toEqual(["token"]);
      expect(adminTableConfig.uploads?.readOnlyColumns).toEqual([
        "id",
        "createdAt",
      ]);
    });

    it("should be a partial record with EnabledTableKeys", () => {
      expect(typeof adminTableConfig).toBe("object");
      expect(adminTableConfig).not.toBeNull();
    });

    it("should contain only valid table configurations", () => {
      const validKeys = Object.keys(mockEnabledTablesMap);
      const configKeys = Object.keys(adminTableConfig);

      configKeys.forEach((key) => {
        expect(validKeys).toContain(key);
      });
    });
  });

  describe("getTableConfig", () => {
    it("should return existing config for uploads table", () => {
      const config = getTableConfig("uploads" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: "userId",
        hiddenColumns: ["token"],
        readOnlyColumns: ["id", "createdAt"],
      });
    });

    it("should return default config for unconfigured tables", () => {
      const config = getTableConfig("sessions" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });

    it("should return default config for payments table", () => {
      const config = getTableConfig("payments" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });

    it("should return default config for subscriptions table", () => {
      const config = getTableConfig("subscriptions" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });

    it("should return default config for users table", () => {
      const config = getTableConfig("users" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });

    it("should return default config for verifications table", () => {
      const config = getTableConfig("verifications" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });

    it("should handle edge cases gracefully", () => {
      // Test with table name that's not in enabled tables (should still work with type casting)
      const config = getTableConfig("nonexistent" as EnabledTableKeys);

      expect(config).toEqual({
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
      });
    });
  });

  describe("isUserRelatedTable", () => {
    it("should return true for uploads table (string userRelated)", () => {
      const result = isUserRelatedTable("uploads" as EnabledTableKeys);
      expect(result).toBe(true);
    });

    it("should return false for sessions table (no userRelated)", () => {
      const result = isUserRelatedTable("sessions" as EnabledTableKeys);
      expect(result).toBe(false);
    });

    it("should return false for payments table", () => {
      const result = isUserRelatedTable("payments" as EnabledTableKeys);
      expect(result).toBe(false);
    });

    it("should return false for subscriptions table", () => {
      const result = isUserRelatedTable("subscriptions" as EnabledTableKeys);
      expect(result).toBe(false);
    });

    it("should return false for users table", () => {
      const result = isUserRelatedTable("users" as EnabledTableKeys);
      expect(result).toBe(false);
    });

    it("should return false for verifications table", () => {
      const result = isUserRelatedTable("verifications" as EnabledTableKeys);
      expect(result).toBe(false);
    });

    it("should handle boolean true userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.sessions;
      (adminTableConfig as any).sessions = { userRelated: true };

      const result = isUserRelatedTable("sessions" as EnabledTableKeys);
      expect(result).toBe(true);

      // Restore original config
      (adminTableConfig as any).sessions = originalConfig;
    });

    it("should handle boolean false userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.payments;
      (adminTableConfig as any).payments = { userRelated: false };

      const result = isUserRelatedTable("payments" as EnabledTableKeys);
      expect(result).toBe(false);

      // Restore original config
      (adminTableConfig as any).payments = originalConfig;
    });

    it("should handle undefined userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.subscriptions;
      (adminTableConfig as any).subscriptions = { userRelated: undefined };

      const result = isUserRelatedTable("subscriptions" as EnabledTableKeys);
      expect(result).toBe(false);

      // Restore original config
      (adminTableConfig as any).subscriptions = originalConfig;
    });
  });

  describe("getUserRelatedColumn", () => {
    it("should return column name for uploads table (string userRelated)", () => {
      const result = getUserRelatedColumn("uploads" as EnabledTableKeys);
      expect(result).toBe("userId");
    });

    it("should return null for sessions table (no userRelated)", () => {
      const result = getUserRelatedColumn("sessions" as EnabledTableKeys);
      expect(result).toBeNull();
    });

    it("should return null for payments table", () => {
      const result = getUserRelatedColumn("payments" as EnabledTableKeys);
      expect(result).toBeNull();
    });

    it("should return null for subscriptions table", () => {
      const result = getUserRelatedColumn("subscriptions" as EnabledTableKeys);
      expect(result).toBeNull();
    });

    it("should return null for users table", () => {
      const result = getUserRelatedColumn("users" as EnabledTableKeys);
      expect(result).toBeNull();
    });

    it("should return null for verifications table", () => {
      const result = getUserRelatedColumn("verifications" as EnabledTableKeys);
      expect(result).toBeNull();
    });

    it("should return 'userId' for boolean true userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.sessions;
      (adminTableConfig as any).sessions = { userRelated: true };

      const result = getUserRelatedColumn("sessions" as EnabledTableKeys);
      expect(result).toBe("userId");

      // Restore original config
      (adminTableConfig as any).sessions = originalConfig;
    });

    it("should return null for boolean false userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.payments;
      (adminTableConfig as any).payments = { userRelated: false };

      const result = getUserRelatedColumn("payments" as EnabledTableKeys);
      expect(result).toBeNull();

      // Restore original config
      (adminTableConfig as any).payments = originalConfig;
    });

    it("should return custom column name for string userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.subscriptions;
      (adminTableConfig as any).subscriptions = { userRelated: "customUserId" };

      const result = getUserRelatedColumn("subscriptions" as EnabledTableKeys);
      expect(result).toBe("customUserId");

      // Restore original config
      (adminTableConfig as any).subscriptions = originalConfig;
    });

    it("should return null for undefined userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.users;
      (adminTableConfig as any).users = { userRelated: undefined };

      const result = getUserRelatedColumn("users" as EnabledTableKeys);
      expect(result).toBeNull();

      // Restore original config
      (adminTableConfig as any).users = originalConfig;
    });

    it("should handle null userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.verifications;
      (adminTableConfig as any).verifications = { userRelated: null };

      const result = getUserRelatedColumn("verifications" as EnabledTableKeys);
      expect(result).toBeNull();

      // Restore original config
      (adminTableConfig as any).verifications = originalConfig;
    });
  });

  describe("Configuration Consistency", () => {
    it("should maintain consistent defaults across functions", () => {
      const tableName = "sessions" as EnabledTableKeys;

      const config = getTableConfig(tableName);
      const isUserRelated = isUserRelatedTable(tableName);
      const userColumn = getUserRelatedColumn(tableName);

      expect(config.userRelated).toBe(false);
      expect(isUserRelated).toBe(false);
      expect(userColumn).toBeNull();
    });

    it("should maintain consistency for configured tables", () => {
      const tableName = "uploads" as EnabledTableKeys;

      const config = getTableConfig(tableName);
      const isUserRelated = isUserRelatedTable(tableName);
      const userColumn = getUserRelatedColumn(tableName);

      expect(config.userRelated).toBe("userId");
      expect(isUserRelated).toBe(true);
      expect(userColumn).toBe("userId");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty string userRelated", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.payments;
      (adminTableConfig as any).payments = { userRelated: "" };

      const isUserRelated = isUserRelatedTable("payments" as EnabledTableKeys);
      const userColumn = getUserRelatedColumn("payments" as EnabledTableKeys);

      expect(isUserRelated).toBe(false); // empty string is falsy
      expect(userColumn).toBe(""); // but getUserRelatedColumn returns the actual string

      // Restore original config
      (adminTableConfig as any).payments = originalConfig;
    });

    it("should handle numeric userRelated (edge case)", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.subscriptions;
      (adminTableConfig as any).subscriptions = { userRelated: 0 };

      const isUserRelated = isUserRelatedTable(
        "subscriptions" as EnabledTableKeys,
      );
      const userColumn = getUserRelatedColumn(
        "subscriptions" as EnabledTableKeys,
      );

      expect(isUserRelated).toBe(false); // 0 is falsy
      expect(userColumn).toBeNull(); // not a string or true

      // Restore original config
      (adminTableConfig as any).subscriptions = originalConfig;
    });

    it("should handle object userRelated (edge case)", () => {
      // Temporarily modify config for testing
      const originalConfig = adminTableConfig.users;
      (adminTableConfig as any).users = { userRelated: {} };

      const isUserRelated = isUserRelatedTable("users" as EnabledTableKeys);
      const userColumn = getUserRelatedColumn("users" as EnabledTableKeys);

      expect(isUserRelated).toBe(true); // object is truthy
      expect(userColumn).toBeNull(); // not a string or true

      // Restore original config
      (adminTableConfig as any).users = originalConfig;
    });
  });

  describe("Default Configuration Properties", () => {
    it("should provide correct default hiddenColumns", () => {
      const config = getTableConfig("sessions" as EnabledTableKeys);
      expect(config.hiddenColumns).toEqual([]);
      expect(Array.isArray(config.hiddenColumns)).toBe(true);
    });

    it("should provide correct default readOnlyColumns", () => {
      const config = getTableConfig("payments" as EnabledTableKeys);
      expect(config.readOnlyColumns).toEqual(["id", "createdAt", "updatedAt"]);
      expect(Array.isArray(config.readOnlyColumns)).toBe(true);
      expect(config.readOnlyColumns).toContain("id");
      expect(config.readOnlyColumns).toContain("createdAt");
      expect(config.readOnlyColumns).toContain("updatedAt");
    });

    it("should preserve existing configuration properties", () => {
      const config = getTableConfig("uploads" as EnabledTableKeys);
      expect(config.hiddenColumns).toEqual(["token"]);
      expect(config.readOnlyColumns).toEqual(["id", "createdAt"]);
      expect(config.readOnlyColumns).not.toContain("updatedAt"); // uploads config doesn't include it
    });
  });

  describe("Type Safety and Structure", () => {
    it("should return objects with correct structure", () => {
      const config = getTableConfig("users" as EnabledTableKeys);

      expect(config).toHaveProperty("userRelated");
      expect(config).toHaveProperty("hiddenColumns");
      expect(config).toHaveProperty("readOnlyColumns");

      expect(
        typeof config.userRelated === "boolean" ||
          typeof config.userRelated === "string",
      ).toBe(true);
      expect(Array.isArray(config.hiddenColumns)).toBe(true);
      expect(Array.isArray(config.readOnlyColumns)).toBe(true);
    });

    it("should maintain immutable default configuration", () => {
      const config1 = getTableConfig("verifications" as EnabledTableKeys);
      const config2 = getTableConfig("verifications" as EnabledTableKeys);

      // Modify one config
      config1.hiddenColumns?.push("test");

      // Other config should remain unchanged
      expect(config2.hiddenColumns).toEqual([]);
    });
  });

  describe("All Enabled Tables Coverage", () => {
    it("should handle all enabled table keys", () => {
      const enabledTableKeys: EnabledTableKeys[] = [
        "uploads",
        "sessions",
        "payments",
        "subscriptions",
        "users",
        "verifications",
      ];

      enabledTableKeys.forEach((tableName) => {
        expect(() => getTableConfig(tableName)).not.toThrow();
        expect(() => isUserRelatedTable(tableName)).not.toThrow();
        expect(() => getUserRelatedColumn(tableName)).not.toThrow();

        const config = getTableConfig(tableName);
        expect(config).toBeDefined();
        expect(config).toHaveProperty("userRelated");
        expect(config).toHaveProperty("hiddenColumns");
        expect(config).toHaveProperty("readOnlyColumns");
      });
    });
  });

  describe("Function Return Types", () => {
    it("getTableConfig should return TableConfig", () => {
      const config = getTableConfig("uploads" as EnabledTableKeys);
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();
    });

    it("isUserRelatedTable should return boolean", () => {
      const result = isUserRelatedTable("uploads" as EnabledTableKeys);
      expect(typeof result).toBe("boolean");
    });

    it("getUserRelatedColumn should return string or null", () => {
      const result1 = getUserRelatedColumn("uploads" as EnabledTableKeys);
      const result2 = getUserRelatedColumn("sessions" as EnabledTableKeys);

      expect(typeof result1 === "string" || result1 === null).toBe(true);
      expect(typeof result2 === "string" || result2 === null).toBe(true);
      expect(result1).toBe("userId");
      expect(result2).toBeNull();
    });
  });
});
