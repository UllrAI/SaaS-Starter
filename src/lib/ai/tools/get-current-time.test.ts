import type { ToolExecutionOptions } from "ai";
import { getCurrentTime } from "./get-current-time";

const executionOptions = {} as ToolExecutionOptions;

function execute(input: { timeZone?: string }) {
  return getCurrentTime.execute!(input, executionOptions) as {
    iso?: string;
    timeZone?: string;
    localized?: string;
    error?: string;
  };
}

describe("getCurrentTime", () => {
  it("returns the current time in UTC by default", () => {
    const result = execute({});
    expect(result.timeZone).toBe("UTC");
    expect(new Date(result.iso!).getTime()).not.toBeNaN();
    expect(result.localized).toBeTruthy();
  });

  it("localizes to the requested time zone", () => {
    const result = execute({ timeZone: "Asia/Shanghai" });
    expect(result.timeZone).toBe("Asia/Shanghai");
    expect(result.error).toBeUndefined();
  });

  it("reports unknown time zones instead of throwing", () => {
    const result = execute({ timeZone: "Not/AZone" });
    expect(result.error).toContain("Not/AZone");
    expect(result.iso).toBeUndefined();
  });
});
