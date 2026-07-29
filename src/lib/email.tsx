import { Resend } from "resend";

import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/config/constants";
import { getEmailConfig } from "@/lib/config/integrations";

const DEFAULT_SENDER_NAME = APP_NAME;
let resend: Resend | undefined;

function getResendClient(apiKey: string): Resend {
  resend ??= new Resend(apiKey);
  return resend;
}

type EmailBody = ReactNode | { html: string; text?: string };

export async function sendEmail(
  email: string,
  subject: string,
  body: EmailBody,
) {
  const config = getEmailConfig();
  const payload =
    typeof body === "object" &&
    body !== null &&
    "html" in body &&
    typeof body.html === "string"
      ? {
          html: body.html,
          text: body.text,
        }
      : {
          react: <>{body}</>,
        };

  const { error } = await getResendClient(config.apiKey).emails.send({
    from: `${DEFAULT_SENDER_NAME} <${config.from}>`,
    to: email,
    subject,
    ...payload,
  });

  if (error) {
    throw error;
  }
}
