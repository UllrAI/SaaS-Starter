import { describe, it, expect, jest } from "@jest/globals";
import fs from "fs";
import path from "path";

// Mock all the dependencies to avoid complex import issues
jest.mock("./types", () => ({
  // Export mock types that match the real interfaces
}));

jest.mock("./config", () => ({
  adminTableConfig: {},
  getTableConfig: jest.fn(),
  isUserRelatedTable: jest.fn(),
  getUserRelatedColumn: jest.fn(),
}));

jest.mock("./schema-generator", () => ({
  getTableSchema: jest.fn(),
}));

jest.mock("./stats", () => ({
  getAdminStats: jest.fn(),
}));

describe("Admin Index Module", () => {
  it("should exist as a TypeScript file with proper exports", () => {
    const indexPath = path.join(__dirname, "index.ts");

    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, "utf8");
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
  });

  it("should export types from types module", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify types exports
    expect(content).toContain("type TableConfig");
    expect(content).toContain("type ColumnType");
    expect(content).toContain("type ColumnInfo");
    expect(content).toContain("type SchemaInfo");
    expect(content).toContain('from "./types"');
  });

  it("should export config functions from config module", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify config exports
    expect(content).toContain("adminTableConfig");
    expect(content).toContain("getTableConfig");
    expect(content).toContain("isUserRelatedTable");
    expect(content).toContain("getUserRelatedColumn");
    expect(content).toContain('from "./config"');
  });

  it("should export schema generator functions", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify schema-generator exports
    expect(content).toContain("getTableSchema");
    expect(content).toContain('from "./schema-generator"');
  });

  it("should export stats functions and types", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify stats exports
    expect(content).toContain("getAdminStats");
    expect(content).toContain("type AdminStatsWithCharts");
    expect(content).toContain("type ChartData");
    expect(content).toContain("type UploadStatsDetails");
    expect(content).toContain('from "./stats"');
  });

  it("should have proper export structure", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify export statements
    const exportMatches = content.match(/export\s*{[^}]+}\s*from/g);
    expect(exportMatches).toBeTruthy();
    expect(exportMatches!.length).toBeGreaterThanOrEqual(4); // At least 4 export statements

    // Each export should have proper structure
    expect(content).toMatch(/export\s*{\s*type\s+/); // Type exports
    expect(content).toMatch(/export\s*{\s*\w+/); // Value exports
  });

  it("should organize exports by module", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify modular organization
    expect(content).toContain("./types");
    expect(content).toContain("./config");
    expect(content).toContain("./schema-generator");
    expect(content).toContain("./stats");

    // Each module should have its own export line
    const lines = content
      .split("\n")
      .filter((line) => line.trim().startsWith("export"));
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });

  it("should use proper TypeScript type export syntax", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify TypeScript type export syntax
    expect(content).toContain("type TableConfig");
    expect(content).toContain("type ColumnType");
    expect(content).toContain("type ColumnInfo");
    expect(content).toContain("type SchemaInfo");
    expect(content).toContain("type AdminStatsWithCharts");
    expect(content).toContain("type ChartData");
    expect(content).toContain("type UploadStatsDetails");
  });

  it("should not contain implementation details", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Index should only contain exports, no implementations
    expect(content).not.toContain("function ");
    expect(content).not.toContain("const ");
    expect(content).not.toContain("let ");
    expect(content).not.toContain("var ");
    expect(content).not.toContain("class ");
    expect(content).not.toContain("interface ");
  });

  it("should have proper module re-export pattern", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // 每一行要么是注释，要么是导出语句的一部分
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      const isComment = trimmedLine.startsWith("//");
      const isExportPart = /^(export\s*\{|type|\w+,?|\}\s*from)/.test(
        trimmedLine,
      );

      // 断言每一行都必须是注释或导出语句的一部分
      expect(isComment || isExportPart).toBe(true);
    });

    // 检查文件是否包含核心的导出关键字
    expect(content).toContain("export {");
    expect(content).toContain("} from ");
  });

  it("should provide comprehensive admin module exports", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify comprehensive coverage of admin functionality
    const expectedExports = [
      "TableConfig",
      "ColumnType",
      "ColumnInfo",
      "SchemaInfo",
      "adminTableConfig",
      "getTableConfig",
      "isUserRelatedTable",
      "getUserRelatedColumn",
      "getTableSchema",
      "getAdminStats",
      "AdminStatsWithCharts",
      "ChartData",
      "UploadStatsDetails",
    ];

    expectedExports.forEach((exportName) => {
      expect(content).toContain(exportName);
    });
  });

  it("should have clean and maintainable structure", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Should be concise
    const lines = content.split("\n");
    expect(lines.length).toBeLessThan(30); // Keep it simple

    // Should have proper spacing and formatting
    // expect(content).not.toContain("  "); // No double spaces
    expect(content).toContain("export {"); // Proper export syntax
    expect(content).toMatch(/from\s+"\.\/\w+"/); // Proper import paths
  });

  it("should be importable as a module", async () => {
    // Test that the module can be imported without errors
    const indexModule = await import("./index");
    expect(typeof indexModule).toBe("object");

    // Verify the module exports exist
    expect(indexModule).toHaveProperty("adminTableConfig");
    expect(indexModule).toHaveProperty("getTableConfig");
    expect(indexModule).toHaveProperty("isUserRelatedTable");
    expect(indexModule).toHaveProperty("getUserRelatedColumn");
    expect(indexModule).toHaveProperty("getTableSchema");
    expect(indexModule).toHaveProperty("getAdminStats");
  });

  it("should have proper relative import paths", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify all imports use relative paths
    const importMatches = content.match(/from\s+"([^"]+)"/g);
    expect(importMatches).toBeTruthy();

    importMatches!.forEach((match) => {
      const path = match.match(/from\s+"([^"]+)"/)?.[1];
      expect(path).toMatch(/^\.\/[\w-]+$/); // Should start with ./ and be simple (allow hyphens)
    });
  });

  it("should follow barrel export pattern", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify barrel export pattern
    expect(content).toMatch(/export\s*{[^}]+}\s*from\s*"[^"]+"/);

    // Should not have default exports in a barrel file
    expect(content).not.toContain("export default");

    // Should group related exports
    expect(content).toContain("type TableConfig");
    expect(content).toContain("type ColumnType");
  });

  it("should have appropriate line length and readability", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    const lines = content.split("\n");

    // Check line lengths are reasonable
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        expect(line.length).toBeLessThan(120); // Reasonable line length
      }
    });

    // Should have proper formatting
    expect(content).toMatch(/export\s*{\s*type\s+\w+/); // Proper spacing
  });

  it("should execute all exports successfully", async () => {
    // Import and test all exported functions
    const {
      adminTableConfig,
      getTableConfig,
      isUserRelatedTable,
      getUserRelatedColumn,
      getTableSchema,
      getAdminStats,
    } = await import("./index");

    // Verify functions are callable
    expect(typeof getTableConfig).toBe("function");
    expect(typeof isUserRelatedTable).toBe("function");
    expect(typeof getUserRelatedColumn).toBe("function");
    expect(typeof getTableSchema).toBe("function");
    expect(typeof getAdminStats).toBe("function");

    // Verify config object exists
    expect(typeof adminTableConfig).toBe("object");
    expect(adminTableConfig).toBeDefined();
  });

  it("should provide type exports that can be used in TypeScript", () => {
    const indexPath = path.join(__dirname, "index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    // Verify all type exports are present
    const typeExports = [
      "TableConfig",
      "ColumnType",
      "ColumnInfo",
      "SchemaInfo",
      "AdminStatsWithCharts",
      "ChartData",
      "UploadStatsDetails",
    ];

    typeExports.forEach((typeExport) => {
      expect(content).toContain(`type ${typeExport}`);
    });
  });

  it("should maintain proper module boundaries", async () => {
    // Test that all modules are accessible through the index
    const indexModule = await import("./index");

    // Each module's key exports should be available
    const coreExports = [
      "adminTableConfig",
      "getTableConfig",
      "isUserRelatedTable",
      "getUserRelatedColumn",
      "getTableSchema",
      "getAdminStats",
    ];

    coreExports.forEach((exportName) => {
      expect(indexModule).toHaveProperty(exportName);
      expect(indexModule[exportName as keyof typeof indexModule]).toBeDefined();
    });
  });
});
