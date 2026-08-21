import type { ToolSet } from "ai";
import type { AgentContext } from "../context";
import { composeSkills, mergeToolSets } from "./compose";
import type { AgentSkill } from "./types";

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

function fakeTool(description: string): ToolSet[string] {
  return { description } as ToolSet[string];
}

describe("mergeToolSets", () => {
  it("merges tools from multiple sets", () => {
    const merged = mergeToolSets(
      { alpha: fakeTool("a") },
      { beta: fakeTool("b") },
    );
    expect(Object.keys(merged)).toEqual(["alpha", "beta"]);
  });

  it("throws on duplicate tool names", () => {
    expect(() =>
      mergeToolSets({ alpha: fakeTool("a") }, { alpha: fakeTool("b") }),
    ).toThrow('Duplicate agent tool "alpha"');
  });
});

describe("composeSkills", () => {
  const timeSkill: AgentSkill = {
    id: "time",
    description: "time skill",
    instructions: "Use the clock tool.",
    tools: () => ({ clock: fakeTool("clock") }),
  };

  const accountSkill: AgentSkill = {
    id: "account",
    description: "account skill",
    instructions: "Look up the account first.",
    tools: (skillContext) => ({
      account: fakeTool(`account for ${skillContext.userId}`),
    }),
  };

  it("joins skill instructions under skill headings", () => {
    const { instructions } = composeSkills([timeSkill, accountSkill], context);
    expect(instructions).toBe(
      "## Skill: time\n\nUse the clock tool.\n\n## Skill: account\n\nLook up the account first.",
    );
  });

  it("collects tools and passes the request context to factories", () => {
    const { tools } = composeSkills([timeSkill, accountSkill], context);
    expect(Object.keys(tools)).toEqual(["clock", "account"]);
    expect(tools.account.description).toBe("account for user-1");
  });

  it("supports skills without tools", () => {
    const promptOnly: AgentSkill = {
      id: "tone",
      description: "prompt-only skill",
      instructions: "Keep answers short.",
    };
    const { tools } = composeSkills([promptOnly], context);
    expect(Object.keys(tools)).toEqual([]);
  });

  it("rejects duplicate tool names across skills", () => {
    const clash: AgentSkill = {
      ...accountSkill,
      id: "clash",
      tools: () => ({ clock: fakeTool("duplicate") }),
    };
    expect(() => composeSkills([timeSkill, clash], context)).toThrow(
      'Duplicate agent tool "clock"',
    );
  });
});
