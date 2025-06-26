import { describe, it, expect, afterEach } from "@jest/globals";
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
      // Test basic connectivity
      const result = await sql`SELECT 1 as test_value`;
      expect(result).toBeDefined();
      expect(result[0]).toEqual({ testValue: 1 });
    });

    it("should handle connection errors gracefully", async () => {
      // Test error handling
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
      const originalPoolSize = process.env.DB_POOL_SIZE;
      const originalVercel = process.env.VERCEL;

      // Ensure we're not in serverless mode
      delete process.env.VERCEL;
      process.env.DB_POOL_SIZE = "15";

      const config = getConnectionConfig();
      expect(config.max).toBe(15);

      // Restore environment
      if (originalPoolSize) {
        process.env.DB_POOL_SIZE = originalPoolSize;
      } else {
        delete process.env.DB_POOL_SIZE;
      }
      if (originalVercel) {
        process.env.VERCEL = originalVercel;
      }
    });
  });
});
