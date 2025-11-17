import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock environment variables
jest.mock("@/env", () => ({
  DATABASE_URL: "postgresql://test:password@localhost:5432/testdb",
}));

// Mock drizzle-kit
const mockDefineConfig = jest.fn((config) => config);
jest.mock("drizzle-kit", () => ({
  defineConfig: mockDefineConfig,
}));

describe("database configuration", () => {
  beforeEach(() => {
    // Only clear send mocks, not the defineConfig mock
    mockDefineConfig.mockClear();
  });

  describe("database/config.ts (development)", () => {
    it("should export default config with correct properties", () => {
      const config = require("./config").default;

      expect(config).toBeDefined();
      expect(config.dialect).toBe("postgresql");
      expect(config.schema).toBe("./src/database/schema.ts");
      expect(config.out).toBe("./src/database/migrations/development");
      expect(config.verbose).toBe(true);
      expect(config.dbCredentials).toEqual({
        url: "postgresql://test:password@localhost:5432/testdb",
      });
    });

    it("should be properly structured for drizzle-kit", () => {
      const config = require("./config").default;

      // Verify all required properties exist and have correct types
      expect(config).toHaveProperty("dialect", "postgresql");
      expect(config).toHaveProperty("schema", "./src/database/schema.ts");
      expect(config).toHaveProperty(
        "out",
        "./src/database/migrations/development",
      );
      expect(config).toHaveProperty("verbose", true);
      expect(config).toHaveProperty("dbCredentials");
      expect(config.dbCredentials).toHaveProperty("url");
    });

    it("should use environment DATABASE_URL", () => {
      const config = require("./config").default;

      expect(config.dbCredentials.url).toBe(
        "postgresql://test:password@localhost:5432/testdb",
      );
    });

    it("should have verbose mode enabled for development", () => {
      const config = require("./config").default;

      expect(config.verbose).toBe(true);
    });

    it("should use development migrations folder", () => {
      const config = require("./config").default;

      expect(config.out).toBe("./src/database/migrations/development");
    });

    it("should use postgresql dialect", () => {
      const config = require("./config").default;

      expect(config.dialect).toBe("postgresql");
    });

    it("should reference correct schema file", () => {
      const config = require("./config").default;

      expect(config.schema).toBe("./src/database/schema.ts");
    });
  });

  describe("database/config.prod.ts (production)", () => {
    it("should export default config with correct properties", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig).toBeDefined();
      expect(prodConfig.dialect).toBe("postgresql");
      expect(prodConfig.schema).toBe("./src/database/schema.ts");
      expect(prodConfig.out).toBe("./src/database/migrations/production");
      expect(prodConfig.verbose).toBeUndefined(); // Production doesn't have verbose
      expect(prodConfig.dbCredentials).toEqual({
        url: "postgresql://test:password@localhost:5432/testdb",
      });
    });

    it("should be properly structured for drizzle-kit", () => {
      const prodConfig = require("./config.prod").default;

      // Verify all required properties exist and have correct types
      expect(prodConfig).toHaveProperty("dialect", "postgresql");
      expect(prodConfig).toHaveProperty("schema", "./src/database/schema.ts");
      expect(prodConfig).toHaveProperty(
        "out",
        "./src/database/migrations/production",
      );
      expect(prodConfig).toHaveProperty("dbCredentials");
      expect(prodConfig.dbCredentials).toHaveProperty("url");
      // Production should not have verbose property
      expect(prodConfig.verbose).toBeUndefined();
    });

    it("should use environment DATABASE_URL", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig.dbCredentials.url).toBe(
        "postgresql://test:password@localhost:5432/testdb",
      );
    });

    it("should not have verbose mode for production", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig.verbose).toBeUndefined();
    });

    it("should use production migrations folder", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig.out).toBe("./src/database/migrations/production");
    });

    it("should use postgresql dialect", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig.dialect).toBe("postgresql");
    });

    it("should reference correct schema file", () => {
      const prodConfig = require("./config.prod").default;

      expect(prodConfig.schema).toBe("./src/database/schema.ts");
    });
  });

  describe("configuration differences", () => {
    it("should have different migration output directories", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.out).toBe("./src/database/migrations/development");
      expect(prodConfig.out).toBe("./src/database/migrations/production");
      expect(devConfig.out).not.toBe(prodConfig.out);
    });

    it("should have verbose enabled only in development", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.verbose).toBe(true);
      expect(prodConfig.verbose).toBeUndefined();
    });

    it("should use same dialect for both environments", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.dialect).toBe("postgresql");
      expect(prodConfig.dialect).toBe("postgresql");
      expect(devConfig.dialect).toBe(prodConfig.dialect);
    });

    it("should use same schema file for both environments", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.schema).toBe("./src/database/schema.ts");
      expect(prodConfig.schema).toBe("./src/database/schema.ts");
      expect(devConfig.schema).toBe(prodConfig.schema);
    });

    it("should use same database credentials for both environments", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.dbCredentials).toEqual(prodConfig.dbCredentials);
    });
  });

  describe("environment integration", () => {
    it("should import from correct env module", () => {
      // This test ensures the env import is working
      const env = require("@/env");
      expect(env.DATABASE_URL).toBe(
        "postgresql://test:password@localhost:5432/testdb",
      );
    });

    it("should handle different DATABASE_URL formats", () => {
      // Test that config properly uses whatever DATABASE_URL is provided
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.dbCredentials.url).toBe(
        "postgresql://test:password@localhost:5432/testdb",
      );
      expect(prodConfig.dbCredentials.url).toBe(
        "postgresql://test:password@localhost:5432/testdb",
      );
    });
  });

  describe("drizzle-kit integration", () => {
    it("should import defineConfig from drizzle-kit", () => {
      const { defineConfig } = require("drizzle-kit");
      expect(defineConfig).toBe(mockDefineConfig);
    });

    it("should return valid configuration objects", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      // Both configurations should be objects returned by defineConfig
      expect(typeof devConfig).toBe("object");
      expect(typeof prodConfig).toBe("object");
      expect(devConfig).not.toBeNull();
      expect(prodConfig).not.toBeNull();
    });

    it("should have all required drizzle-kit properties", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      [devConfig, prodConfig].forEach((config) => {
        expect(config).toHaveProperty("dialect");
        expect(config).toHaveProperty("schema");
        expect(config).toHaveProperty("out");
        expect(config).toHaveProperty("dbCredentials");
        expect(config.dbCredentials).toHaveProperty("url");
      });
    });
  });

  describe("type safety", () => {
    it("should export default configuration object", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(typeof devConfig).toBe("object");
      expect(typeof prodConfig).toBe("object");
      expect(devConfig).not.toBeNull();
      expect(prodConfig).not.toBeNull();
    });

    it("should have string values for required properties", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      [devConfig, prodConfig].forEach((config) => {
        expect(typeof config.dialect).toBe("string");
        expect(typeof config.schema).toBe("string");
        expect(typeof config.out).toBe("string");
        expect(typeof config.dbCredentials.url).toBe("string");
      });
    });

    it("should have boolean or undefined verbose property", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(
        typeof devConfig.verbose === "boolean" ||
          devConfig.verbose === undefined,
      ).toBe(true);
      expect(
        typeof prodConfig.verbose === "boolean" ||
          prodConfig.verbose === undefined,
      ).toBe(true);
    });
  });

  describe("file paths", () => {
    it("should use relative paths for schema and output", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      [devConfig, prodConfig].forEach((config) => {
        expect(config.schema.startsWith("./")).toBe(true);
        expect(config.out.startsWith("./")).toBe(true);
      });
    });

    it("should point to valid schema file path", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      [devConfig, prodConfig].forEach((config) => {
        expect(config.schema).toBe("./src/database/schema.ts");
      });
    });

    it("should have different migration directories", () => {
      const devConfig = require("./config").default;
      const prodConfig = require("./config.prod").default;

      expect(devConfig.out).toContain("development");
      expect(prodConfig.out).toContain("production");
    });
  });
});
