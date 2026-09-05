const errorKeys = new Set([
  "ai_budget_reached",
  "ai_run_conflict",
  "ai_conversation_changed",
  "ai_context_full",
]);

export function getChatErrorKey(error: Error): string {
  try {
    const payload: unknown = JSON.parse(error.message);
    if (
      payload &&
      typeof payload === "object" &&
      "code" in payload &&
      typeof payload.code === "string" &&
      errorKeys.has(payload.code)
    )
      return payload.code;
  } catch {
    /* Provider messages are never rendered directly. */
  }
  return "ai_chat_error_message";
}
