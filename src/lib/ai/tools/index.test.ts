import type { AgentContext } from "../context";
import { agentTools, buildTools } from "./index";

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

describe("tool registry", () => {
  it("builds only the requested tools, keyed by registry name", () => {
    const tools = buildTools(["getCurrentTime", "readArticle"], context);
    expect(Object.keys(tools)).toEqual(["getCurrentTime", "readArticle"]);
    expect(tools.getCurrentTime.description).toBeTruthy();
  });

  it("gives every registered tool a description for the model", () => {
    for (const name of Object.keys(agentTools) as (keyof typeof agentTools)[]) {
      const [built] = Object.values(buildTools([name], context));
      expect(built.description).toBeTruthy();
    }
  });

  it("returns an empty tool set for an empty selection", () => {
    expect(buildTools([], context)).toEqual({});
  });
});
