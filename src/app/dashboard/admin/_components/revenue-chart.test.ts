import { formatRevenueMonth } from "./revenue-chart";

describe("formatRevenueMonth", () => {
  it("keeps the SQL UTC month in negative-offset time zones", () => {
    const date = new Date("2026-07-01T00:00:00.000Z");
    expect(
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "America/Los_Angeles",
      }).format(date),
    ).toBe("Jun 2026");
    expect(formatRevenueMonth("2026-07", "en-US")).toBe("Jul 2026");
  });
});
