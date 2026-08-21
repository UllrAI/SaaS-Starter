import type { AgentSkill } from "./types";

export const knowledgeBaseSkill: AgentSkill = {
  id: "knowledge-base",
  instructions: `You can answer questions about the product using the published knowledge base.
For any question about features, setup, or how the product works: call searchKnowledgeBase first, then readArticle on the most relevant result before answering. If an article reports hasMore, call readArticle again with nextOffset until you have the part you need.
Base such answers only on what the articles say and link the article path in markdown. If nothing relevant is found, say so plainly instead of guessing.`,
  toolNames: ["searchKnowledgeBase", "readArticle"],
};
