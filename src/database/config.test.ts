import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const mockDefineConfig = jest.fn((config) => config);
jest.mock("drizzle-kit", () => ({
  defineConfig: (...args: unknown[]) => mockDefineConfig(...args),
}));

describe("database/config.ts", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL =
      "postgresql://test:password@localhost:5432/testdb";
    mockDefineConfig.mockClear();
    jest.resetModules();
  });

  afterAll(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
      return;
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
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
