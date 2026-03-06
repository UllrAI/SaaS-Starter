import { Resend } from "resend";

import env from "@/env";
import type { ReactNode } from "react";
import { APP_NAME, RESEND_EMAIL_FROM } from "@/lib/config/constants";
const resend = new Resend(env.RESEND_API_KEY);

const DEFAULT_SENDER_NAME = APP_NAME;

type EmailBody = ReactNode | { html: string; text?: string };

export async function sendEmail(
  email: string,
  subject: string,
  body: EmailBody,
) {
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

  const { error } = await resend.emails.send({
    from: `${DEFAULT_SENDER_NAME} <${RESEND_EMAIL_FROM}>`,
    to: email,
    subject,
    ...payload,
  });

  if (error) {
    throw error;
  }
}
