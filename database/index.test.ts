import { describe, it, expect, afterEach, beforeEach } from "@jest/globals";

// Mock environment before importing anything else
jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NODE_ENV: "test",
    DB_POOL_SIZE: 10,
    DB_IDLE_TIMEOUT: 300,
    DB_MAX_LIFETIME: 14400,
    DB_CONNECT_TIMEOUT: 30,
  }
}));

// Mock postgres
jest.mock("postgres", () => {
  const mockSql = jest.fn(() => Promise.resolve([{ testValue: 1 }]));
  (mockSql as unknown as { end: jest.MockedFunction<() => Promise<void>> }).end = jest.fn(() => Promise.resolve());
  return jest.fn(() => mockSql);
});

// Mock drizzle
jest.mock("drizzle-orm/postgres-js", () => ({
  drizzle: jest.fn(() => ({})),
}));

import { db, sql, closeDatabase } from "./index";
import {
  getConnectionConfig,
  getEnvironmentType,
  validateDatabaseConfig,
} from "@/lib/database/connection";

describe("Database Connection Configuration", () => {
  afterEach(async () => {
    // Clean up connections after each test
    await closeDatabase();
  });

  describe("Dynamic Configuration", () => {
    it("should detect environment type correctly", () => {
      const envType = getEnvironmentType();
      expect(["serverless", "traditional"]).toContain(envType);
    });

    it("should return appropriate configuration for current environment", () => {
      const config = getConnectionConfig();
      expect(config).toBeDefined();
      expect(typeof config.max).toBe("number");
      expect(typeof config.idle_timeout).toBe("number");
      expect(typeof config.max_lifetime).toBe("number");
      expect(typeof config.connect_timeout).toBe("number");
      expect(config.prepare).toBe(true);
    });

    it("should validate configuration without throwing", () => {
      expect(() => validateDatabaseConfig()).not.toThrow();
    });

    it("should have different configurations for different environments", () => {
      // Mock serverless environment
      const originalVercel = process.env.VERCEL;
      process.env.VERCEL = "1";

      const serverlessConfig = getConnectionConfig();
      expect(serverlessConfig.max).toBe(1);
      expect(serverlessConfig.idle_timeout).toBe(20);

      // Restore and test traditional environment
      delete process.env.VERCEL;
      if (originalVercel) {
        process.env.VERCEL = originalVercel;
      }

      const traditionalConfig = getConnectionConfig();
      expect(traditionalConfig.max).toBeGreaterThan(1);
      expect(traditionalConfig.idle_timeout).toBeGreaterThan(20);
    });
  });

  describe("Database Connectivity", () => {
    it("should have proper connection pool configuration", () => {
      // Test that sql client is properly configured
      expect(sql).toBeDefined();
      expect(db).toBeDefined();
    });

    it("should be able to execute a simple query", async () => {
      // Test basic connectivity with mocked sql
      const result = await sql`SELECT 1 as test_value`;
      expect(result).toBeDefined();
      expect(result[0]).toEqual({ testValue: 1 });
    });

    it("should handle connection errors gracefully", async () => {
      // Mock sql to throw an error for this test
      const mockSql = sql as jest.MockedFunction<typeof sql>;
      mockSql.mockImplementationOnce(() => {
        throw new Error('relation "non_existent_table_12345" does not exist');
      });

      try {
        await sql`SELECT * FROM non_existent_table_12345`;
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain(
          'relation "non_existent_table_12345" does not exist',
        );
      }
    });

    it("should properly close database connections", async () => {
      // Test graceful shutdown
      await expect(closeDatabase()).resolves.not.toThrow();
    });
  });

  describe("Environment Variables", () => {
    it("should respect custom pool size in traditional environment", () => {
      // This test is tricky with mocked env, but we can test the logic
      // by checking that the function returns the mocked value
      const config = getConnectionConfig();
      expect(config.max).toBe(10); // Our mocked DB_POOL_SIZE
      
      // Test that the function works as expected
      expect(typeof config.max).toBe('number');
      expect(config.max).toBeGreaterThan(0);
    });

    it("should validate database configuration functionality", () => {
      // Test the validateDatabaseConfig function directly
      // This is more reliable than testing module initialization side effects
      const { validateDatabaseConfig } = require("@/lib/database/connection");
      
      // Test that validateDatabaseConfig is a function and can be called
      expect(typeof validateDatabaseConfig).toBe("function");
      
      // Test that calling validateDatabaseConfig doesn't throw errors
      expect(() => validateDatabaseConfig()).not.toThrow();
      
      // Test multiple calls (should be idempotent due to configValidated flag)
      expect(() => {
        validateDatabaseConfig();
        validateDatabaseConfig();
      }).not.toThrow();
    });

    it("should not call validateDatabaseConfig in non-development environment", async () => {
      // Mock the validateDatabaseConfig function to spy on it
      const validateDatabaseConfigSpy = jest.fn();
      
      // Mock the production environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      
      // Mock the connection module
      jest.doMock("@/lib/database/connection", () => ({
        getConnectionConfig: jest.fn(() => ({ max: 10 })),
        validateDatabaseConfig: validateDatabaseConfigSpy,
      }));
      
      try {
        // Reset modules to force re-import with new NODE_ENV
        jest.resetModules();
        
        // Re-import the database module
        await import("./index");
        
        // Verify that validateDatabaseConfig was NOT called in production
        expect(validateDatabaseConfigSpy).not.toHaveBeenCalled();
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
