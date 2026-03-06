import { describe, it, expect } from "@jest/globals";

describe("Admin Index Module", () => {
  it("should expose expected runtime exports", async () => {
    const indexModule = await import("./index");

    expect(indexModule).toHaveProperty("getAdminStats");
    expect(typeof indexModule.getAdminStats).toBe("function");

    expect(indexModule).not.toHaveProperty("adminTableConfig");
    expect(indexModule).not.toHaveProperty("getTableSchema");
  });
});
