import {
  createReadArticle,
  createSearchKnowledgeBase,
} from "../tools/knowledge-base";
import type { AgentSkill } from "./types";

export const knowledgeBaseSkill: AgentSkill = {
  id: "knowledge-base",
  description:
    "Answers product questions by searching and reading the site's published articles.",
  instructions: `You can answer questions about the product using the published knowledge base.
For any question about features, setup, or how the product works: call searchKnowledgeBase first, then readArticle on the most relevant result before answering.
Base such answers only on what the articles say and link the article path in markdown. If nothing relevant is found, say so plainly instead of guessing.`,
  tools: (context) => ({
    searchKnowledgeBase: createSearchKnowledgeBase(context),
    readArticle: createReadArticle(context),
  }),
};
