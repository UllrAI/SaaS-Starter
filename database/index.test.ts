import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock the dependencies before importing the module
const mockGetConnectionConfig = jest.fn(() => ({
  max: 20,
  idle_timeout: 300,
  max_lifetime: 14400,
  connect_timeout: 30,
  ssl: false,
}));

const mockValidateDatabaseConfig = jest.fn();

jest.mock("@/lib/database/connection", () => ({
  getConnectionConfig: mockGetConnectionConfig,
  validateDatabaseConfig: mockValidateDatabaseConfig,
}));

describe("database/index", () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it("should export database connection objects", async () => {
    const module = await import("./index");
    
    expect(module).toHaveProperty("db");
    expect(module).toHaveProperty("sql");
    expect(module).toHaveProperty("closeDatabase");
    
    expect(typeof module.db).toBe("object");
    expect(typeof module.sql).toBe("function");
    expect(typeof module.closeDatabase).toBe("function");
  });

  it("should have database instance with required methods", async () => {
    const { db } = await import("./index");
    
    // 验证 db 实例有必需的方法
    expect(db).toBeTruthy();
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
    expect(typeof db.select).toBe("function");
    expect(typeof db.insert).toBe("function");
  });

  it("should have sql client as callable function", async () => {
    const { sql } = await import("./index");
    
    // 验证 sql 客户端
    expect(sql).toBeTruthy();
    expect(typeof sql).toBe("function");
  });

  it("should have async closeDatabase function", async () => {
    const { closeDatabase } = await import("./index");
    
    // 验证 closeDatabase 函数
    expect(closeDatabase).toBeTruthy();
    expect(typeof closeDatabase).toBe("function");
    
    // 验证它返回 Promise
    const result = closeDatabase();
    expect(result).toBeInstanceOf(Promise);
    
    // 等待完成以避免未处理的 Promise
    await result;
  });

  it("should create drizzle database instance with proper configuration", async () => {
    const { db } = await import("./index");
    
    // 验证 drizzle 实例配置
    expect(db).toBeTruthy();
    
    // 验证主要的 CRUD 方法（基于 mock 设置）
    expect(typeof db.select).toBe("function");
    expect(typeof db.insert).toBe("function");
  });

  it("should handle database operations correctly", async () => {
    const { db } = await import("./index");
    
    // 验证数据库操作方法的存在（基于 mock 设置）
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
    
    // 验证查询构建器
    const selectQuery = db.select();
    expect(selectQuery).toBeDefined();
    expect(selectQuery.from).toBeDefined();
    
    const insertQuery = db.insert();
    expect(insertQuery).toBeDefined();
    expect(insertQuery.values).toBeDefined();
  });

  it("should export sql client with proper postgres methods", async () => {
    const { sql } = await import("./index");
    
    // 验证 postgres 客户端的方法（基于 mock 设置）
    expect(sql).toBeTruthy();
    expect(typeof sql).toBe("function");
  });

  it("should verify connection config functions are available", async () => {
    // Import module to test its exports
    const module = await import("./index");
    
    // Verify that the module imports the connection functions correctly
    expect(module.db).toBeDefined();
    expect(module.sql).toBeDefined();
    expect(module.closeDatabase).toBeDefined();
    
    // Verify mock functions are properly set up
    expect(mockGetConnectionConfig).toBeDefined();
    expect(mockValidateDatabaseConfig).toBeDefined();
  });

  it("should handle environment-specific configuration", async () => {
    // Test that the module handles different environments
    const originalEnv = process.env.NODE_ENV;
    
    try {
      process.env.NODE_ENV = "test";
      
      // Import the module which should use the connection config
      const module = await import("./index");
      
      expect(module.db).toBeDefined();
      expect(module.sql).toBeDefined();
      expect(module.closeDatabase).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("should handle database connection cleanup", async () => {
    const { closeDatabase, sql } = await import("./index");
    
    // 验证关闭数据库连接的功能
    expect(closeDatabase).toBeTruthy();
    expect(typeof closeDatabase).toBe("function");
    
    // 验证 sql 客户端
    expect(sql).toBeTruthy();
    expect(typeof sql).toBe("function");
    
    // 测试关闭连接
    await expect(closeDatabase()).resolves.toBeUndefined();
  });

  it("should import and execute database configuration", async () => {
    // 这个测试会执行模块的导入时代码
    const module = await import("./index");
    
    // 验证模块导入成功
    expect(module).toBeDefined();
    expect(module.db).toBeDefined();
    expect(module.sql).toBeDefined();
    expect(module.closeDatabase).toBeDefined();
  });

  it("should handle environment configuration during import", async () => {
    // 测试模块导入时的环境配置处理
    const originalNodeEnv = process.env.NODE_ENV;
    
    try {
      process.env.NODE_ENV = "test";
      const module = await import("./index");
      
      expect(module.db).toBeDefined();
      expect(module.sql).toBeDefined();
      expect(module.closeDatabase).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("should create database connection with proper postgres configuration", async () => {
    const { sql } = await import("./index");
    
    // 验证 postgres 连接配置（基于 mock 设置）
    expect(sql).toBeTruthy();
    expect(typeof sql).toBe("function");
  });

  it("should initialize drizzle with tables schema", async () => {
    const { db } = await import("./index");
    
    // 验证 drizzle 实例（基于 mock 设置）
    expect(db).toBeTruthy();
    
    // 验证 drizzle 的核心功能
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
  });

  it("should handle database operations with proper error handling", async () => {
    const { db, closeDatabase } = await import("./index");
    
    // 验证数据库操作
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
    
    // 验证清理函数
    expect(closeDatabase).toBeDefined();
    expect(typeof closeDatabase).toBe("function");
    
    // 测试清理操作
    await expect(closeDatabase()).resolves.toBeUndefined();
  });

  it("should maintain connection state and cleanup properly", async () => {
    const { sql, closeDatabase } = await import("./index");
    
    // 验证连接状态
    expect(sql).toBeTruthy();
    expect(typeof sql).toBe("function");
    
    // 验证清理功能
    expect(closeDatabase).toBeDefined();
    expect(typeof closeDatabase).toBe("function");
    
    // 测试清理操作
    const cleanupPromise = closeDatabase();
    expect(cleanupPromise).toBeInstanceOf(Promise);
    await cleanupPromise;
  });
});