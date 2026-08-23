import type { AgentSkill } from "./types";

export const documentStorageSkill: AgentSkill = {
  id: "document-storage",
  instructions: `You can save a Markdown document to the user's files with saveDocument.
Only call it when the user asks to save, export, or keep something. To simply show a document, use presentArtifact instead.
Saving is confirmed by the user and cannot be undone from the app, so pass the finished content and a short descriptive file name in one call. Never save a document the user has not seen.
If the tool reports an error, tell the user what happened instead of retrying.`,
  toolNames: ["saveDocument"],
};
