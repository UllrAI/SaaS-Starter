import { describe, it, expect } from "@jest/globals";
import fs from "fs";
import path from "path";

describe("Admin Index Module", () => {
  const indexPath = path.join(__dirname, "index.ts");

  it("should export stats only", () => {
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, "utf8");

    expect(content).toContain('from "./stats"');
    expect(content).not.toContain('from "./types"');

    expect(content).not.toContain('from "./config"');
    expect(content).not.toContain('from "./schema-generator"');
    expect(content).not.toContain("adminTableConfig");
    expect(content).not.toContain("getTableSchema");
  });

  it("should expose expected runtime exports", async () => {
    const indexModule = await import("./index");

    expect(indexModule).toHaveProperty("getAdminStats");
    expect(typeof indexModule.getAdminStats).toBe("function");

    expect(indexModule).not.toHaveProperty("adminTableConfig");
    expect(indexModule).not.toHaveProperty("getTableSchema");
  });
});
