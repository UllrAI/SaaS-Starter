import { composeSkills } from "./compose";
import type { AgentSkill } from "./types";

const timeSkill: AgentSkill = {
  id: "time",
  instructions: "Use the clock tool.",
  toolNames: ["getCurrentTime"],
};

const knowledgeSkill: AgentSkill = {
  id: "knowledge",
  instructions: "Search before answering.",
  toolNames: ["searchKnowledgeBase", "readArticle"],
};

describe("composeSkills", () => {
  it("joins skill instructions under skill headings", () => {
    const { instructions } = composeSkills([timeSkill, knowledgeSkill]);
    expect(instructions).toBe(
      "## Skill: time\n\nUse the clock tool.\n\n## Skill: knowledge\n\nSearch before answering.",
    );
  });

  it("collects the tool names the skills need", () => {
    const { toolNames } = composeSkills([timeSkill, knowledgeSkill]);
    expect(toolNames).toEqual([
      "getCurrentTime",
      "searchKnowledgeBase",
      "readArticle",
    ]);
  });

  it("requests a shared tool only once", () => {
    const alsoNeedsSearch: AgentSkill = {
      id: "research",
      instructions: "Search too.",
      toolNames: ["searchKnowledgeBase"],
    };
    const { toolNames } = composeSkills([knowledgeSkill, alsoNeedsSearch]);
    expect(toolNames).toEqual(["searchKnowledgeBase", "readArticle"]);
  });

  it("supports prompt-only skills", () => {
    const promptOnly: AgentSkill = {
      id: "tone",
      instructions: "Keep answers short.",
    };
    const { toolNames, instructions } = composeSkills([promptOnly]);
    expect(toolNames).toEqual([]);
    expect(instructions).toContain("Keep answers short.");
  });
});
