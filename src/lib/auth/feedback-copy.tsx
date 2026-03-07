import { type AuthFeedback, type ResolvedAuthFeedback } from "./feedback";

function BannedTitle() {
  return <>Account disabled</>;
}

function BannedDescription({ reason }: { reason?: string | null }) {
  return reason ? (
    <>
      This account is disabled. Contact support. Reason: {reason}
    </>
  ) : (
    <>This account is disabled. Contact support.</>
  );
}

function SessionExpiredTitle() {
  return <>Session expired</>;
}

function SessionExpiredDescription() {
  return <>Your session ended. Sign in again to continue.</>;
}

function InvalidTokenTitle() {
  return <>Link invalid</>;
}

function InvalidTokenDescription() {
  return <>This sign-in link is invalid. Request a new one.</>;
}

function ExpiredTokenTitle() {
  return <>Link expired</>;
}

function ExpiredTokenDescription() {
  return <>This sign-in link expired. Request a new one.</>;
}

function AttemptsExceededTitle() {
  return <>Link expired</>;
}

function AttemptsExceededDescription() {
  return <>This sign-in link was already used. Request a new one.</>;
}

function RestartProcessTitle() {
  return <>Try again</>;
}

function RestartProcessDescription() {
  return <>The sign-in process was interrupted. Start again.</>;
}

function SignInFailedTitle() {
  return <>Sign-in failed</>;
}

function SignInFailedDescription() {
  return <>Unable to sign in. Try again.</>;
}

export function createAuthFeedback(
  feedback: ResolvedAuthFeedback | null,
): AuthFeedback | null {
  if (!feedback) {
    return null;
  }

  switch (feedback.key) {
    case "banned":
      return {
        title: <BannedTitle />,
        description: <BannedDescription reason={feedback.banReason} />,
      };
    case "session_expired":
      return {
        title: <SessionExpiredTitle />,
        description: <SessionExpiredDescription />,
      };
    case "INVALID_TOKEN":
      return {
        title: <InvalidTokenTitle />,
        description: <InvalidTokenDescription />,
      };
    case "EXPIRED_TOKEN":
      return {
        title: <ExpiredTokenTitle />,
        description: <ExpiredTokenDescription />,
      };
    case "ATTEMPTS_EXCEEDED":
      return {
        title: <AttemptsExceededTitle />,
        description: <AttemptsExceededDescription />,
      };
    case "please_restart_the_process":
      return {
        title: <RestartProcessTitle />,
        description: <RestartProcessDescription />,
      };
    case "sign_in_failed":
      return {
        title: <SignInFailedTitle />,
        description: feedback.rawDescription || <SignInFailedDescription />,
      };
    default:
      return null;
  }
}
