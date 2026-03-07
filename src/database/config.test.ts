import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@/env", () => ({
  DATABASE_URL: "postgresql://test:password@localhost:5432/testdb",
}));

const mockDefineConfig = jest.fn((config) => config);
jest.mock("drizzle-kit", () => ({
  defineConfig: mockDefineConfig,
}));

describe("database/config.ts", () => {
  beforeEach(() => {
    mockDefineConfig.mockClear();
    jest.resetModules();
  });

  it("exports a single migration configuration", () => {
    const config = require("./config").default;

    expect(config).toEqual({
      dialect: "postgresql",
      schema: "./src/database/schema.ts",
      out: "./src/database/migrations",
      verbose: true,
      dbCredentials: {
        url: "postgresql://test:password@localhost:5432/testdb",
      },
    });
  });

  it("passes the configuration through drizzle-kit defineConfig", () => {
    require("./config");

    expect(mockDefineConfig).toHaveBeenCalledTimes(1);
    expect(mockDefineConfig).toHaveBeenCalledWith({
      dialect: "postgresql",
      schema: "./src/database/schema.ts",
      out: "./src/database/migrations",
      verbose: true,
      dbCredentials: {
        url: "postgresql://test:password@localhost:5432/testdb",
      },
    });
  });

  it("uses relative schema and migration paths", () => {
    const config = require("./config").default;

    expect(config.schema.startsWith("./")).toBe(true);
    expect(config.out.startsWith("./")).toBe(true);
  });
});
