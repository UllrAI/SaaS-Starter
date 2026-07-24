import { useTranslation } from "@/lib/i18n/translation/client";
import type { ReactNode } from "react";
import type { ResolvedAuthFeedback } from "@/lib/auth/feedback";
export function AuthFeedbackAlert({
  feedback,
}: {
  feedback: ResolvedAuthFeedback | null;
}) {
  const { t } = useTranslation();
  if (!feedback) {
    return null;
  }
  let description: ReactNode;
  switch (feedback.key) {
    case "banned":
      description = feedback.banReason ? (
        <>
          {t(
            "ef988f570010",
            "This account is disabled. Contact support. Reason: {expression0}",
            {
              expression0: feedback.banReason,
            },
          )}
        </>
      ) : (
        <>{t("9a5d9e78c172", "This account is disabled. Contact support.")}</>
      );
      break;
    case "session_expired":
      description = (
        <>
          {t("228c32b12331", "Your session ended. Sign in again to continue.")}
        </>
      );
      break;
    case "INVALID_TOKEN":
      description = (
        <>
          {t(
            "afc9de29bb06",
            "This sign-in link is invalid. Request a new one.",
          )}
        </>
      );
      break;
    case "EXPIRED_TOKEN":
      description = (
        <>
          {t("ee277c409ae6", "This sign-in link expired. Request a new one.")}
        </>
      );
      break;
    case "ATTEMPTS_EXCEEDED":
      description = (
        <>
          {t(
            "97b615e0adc4",
            "This sign-in link was already used. Request a new one.",
          )}
        </>
      );
      break;
    case "please_restart_the_process":
      description = (
        <>
          {t(
            "76a5d38b7ad6",
            "The sign-in process was interrupted. Start again.",
          )}
        </>
      );
      break;
    case "sign_in_failed":
      description = <>{t("336f0e3003df", "Unable to sign in. Try again.")}</>;
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
