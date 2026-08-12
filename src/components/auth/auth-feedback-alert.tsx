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
          {t("auth_account_disabled_contact_support_reason", {
            expression0: feedback.banReason,
          })}
        </>
      ) : (
        <>{t("auth_account_disabled_contact_support")}</>
      );
      break;
    case "session_expired":
      description = <>{t("auth_session_ended_sign_in_again_continue")}</>;
      break;
    case "INVALID_TOKEN":
      description = <>{t("auth_sign_in_link_invalid_request_new")}</>;
      break;
    case "EXPIRED_TOKEN":
      description = <>{t("auth_sign_in_link_expired_request_new")}</>;
      break;
    case "ATTEMPTS_EXCEEDED":
      description = <>{t("auth_sign_in_link_was_already_used")}</>;
      break;
    case "please_restart_the_process":
      description = <>{t("auth_sign_in_process_was_interrupted_start")}</>;
      break;
    case "sign_in_failed":
      description = <>{t("auth_unable_sign_in_try_again")}</>;
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
