import "server-only";
import { createHmac } from "node:crypto";
import env from "@/env";

// Derived instead of read from a dedicated env var: when the secret is unset
// the SDK skips signature verification entirely (see
// `validateApprovedToolApprovals` in ai/dist/index.js), so a forgotten
// variable would silently turn the approval gate into decoration.
function getToolApprovalSecret(scope: {
  userId: string;
  conversationId: string;
}) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(
      JSON.stringify(["ai-tool-approval", scope.userId, scope.conversationId]),
    )
    .digest();
}

/**
 * Attaches the approval-signing secret to `ToolLoopAgent` settings.
 *
 * `experimental_toolApprovalSecret` reaches `streamText` at runtime but is
 * absent from `ToolLoopAgentSettings` in ai@7, so the cast lives here only. If
 * the SDK renames the option, verification stops without any error — the forged
 * approval case in `tool-approval.test.ts` is what turns that into a red test.
 */
export function withToolApprovalSecret<T extends object>(
  settings: T,
  scope: { userId: string; conversationId: string },
): T {
  return {
    ...settings,
    experimental_toolApprovalSecret: getToolApprovalSecret(scope),
  } as T;
}
