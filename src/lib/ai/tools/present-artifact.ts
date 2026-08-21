import { tool } from "ai";
import { artifactSchema } from "../artifacts";

export function createPresentArtifact() {
  return tool({
    description:
      "Present a finished Markdown document or an existing image/video URL in the user's canvas. Never invent media URLs. Use Markdown for drafts, plans, reports, and other substantial documents.",
    inputSchema: artifactSchema,
    execute: (artifact) => artifact,
  });
}
