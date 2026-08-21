import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";
import { createGetCurrentTime } from "./get-current-time";

const executionOptions = {} as ToolExecutionOptions;

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

function execute(input: { timeZone?: string }, agentContext = context) {
  return createGetCurrentTime(agentContext).execute!(
    input,
    executionOptions,
  ) as {
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

  it("formats using the agent locale rather than a fixed one", () => {
    const english = execute({ timeZone: "UTC" });
    const chinese = execute(
      { timeZone: "UTC" },
      { ...context, locale: "zh-Hans" },
    );
    expect(chinese.localized).not.toBe(english.localized);
  });

  it("reports unknown time zones instead of throwing", () => {
    const result = execute({ timeZone: "Not/AZone" });
    expect(result.error).toContain("Not/AZone");
    expect(result.iso).toBeUndefined();
  });
});
