import type { ReactNode } from "react";
import type { ResolvedAuthFeedback } from "@/lib/auth/feedback";

export function AuthFeedbackAlert({
  feedback,
}: {
  feedback: ResolvedAuthFeedback | null;
}) {
  if (!feedback) {
    return null;
  }

  let description: ReactNode;

  switch (feedback.key) {
    case "banned":
      description = feedback.banReason ? (
        <>
          This account is disabled. Contact support. Reason: {feedback.banReason}
        </>
      ) : (
        <>This account is disabled. Contact support.</>
      );
      break;
    case "session_expired":
      description = <>Your session ended. Sign in again to continue.</>;
      break;
    case "INVALID_TOKEN":
      description = <>This sign-in link is invalid. Request a new one.</>;
      break;
    case "EXPIRED_TOKEN":
      description = <>This sign-in link expired. Request a new one.</>;
      break;
    case "ATTEMPTS_EXCEEDED":
      description = <>This sign-in link was already used. Request a new one.</>;
      break;
    case "please_restart_the_process":
      description = <>The sign-in process was interrupted. Start again.</>;
      break;
    case "sign_in_failed":
      description = <>Unable to sign in. Try again.</>;
      break;
    default:
      return null;
  }

  return (
    <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
      {description}
    </div>
  );
}
