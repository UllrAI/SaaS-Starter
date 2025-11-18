import { sendEmail } from "@/lib/email";
import { APP_NAME, COMPANY_NAME } from "@/lib/config/constants";
import { userAgent } from "next/server";

interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  ip?: string;
}

const EMAIL_STYLES = `
  * {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    box-sizing: border-box;
  }

  blockquote,h1,h2,h3,img,li,ol,p,ul {
    margin-top: 0;
    margin-bottom: 0;
  }

  .email-wrapper {
    background-color: #f5f6fa;
    padding: 32px 16px;
  }

  .email-content {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
  }

  .header {
    padding: 24px 32px;
    border-bottom: 1px solid #e5e7eb;
  }

  .content {
    padding: 32px;
  }

  .footer {
    background-color: #fafafa;
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
  }

  @media only screen and (max-width: 600px) {
    .email-wrapper {
      padding: 20px 12px;
    }
    .header,
    .content,
    .footer {
      padding-left: 20px;
      padding-right: 20px;
    }
    .content {
      padding-top: 24px;
      padding-bottom: 24px;
    }
    h1 {
      font-size: 22px !important;
      line-height: 30px !important;
    }
    p,
    a {
      font-size: 14px !important;
      line-height: 22px !important;
    }
  }
`;

export function getMagicLinkEmailHTML(
  email: string,
  url: string,
  deviceInfo?: DeviceInfo,
): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentYear = now.getFullYear();
  const previewText = `Click the secure button below to complete your sign-in process. Your secure sign-in link for ${APP_NAME}`;

  const safeEmail = escapeHtml(email);
  const safeUrl = escapeHtml(url);
  const safeAppName = escapeHtml(APP_NAME);
  const safeCompanyName = escapeHtml(COMPANY_NAME);
  const safePreview = escapeHtml(previewText);
  const deviceDetails = getDeviceDetailsHtml(deviceInfo);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${EMAIL_STYLES}</style>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f6fa;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none!important;visibility:hidden;mso-hide:all;opacity:0;height:0;width:0;color:transparent;line-height:0;font-size:0;">${safePreview}</span>
    <div class="email-wrapper">
      <div class="email-content" style="max-width:600px;width:100%;margin:0 auto;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div class="header" style="text-align:left;">
          <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin:0 0 6px 0;">${safeAppName}</p>
          <h1 style="font-size:26px;font-weight:600;line-height:34px;color:#111827;margin:0;">Access your account securely</h1>
          <p style="font-size:15px;line-height:22px;color:#4b5563;margin:12px 0 0 0;">
            Use the link below to finish signing in.
          </p>
        </div>
        <div class="content">
          <p style="font-size:15px;line-height:24px;margin:0 0 18px 0;color:#1f2937;text-align:left;">Hello,</p>
          <p style="font-size:15px;line-height:24px;margin:0 0 24px 0;color:#1f2937;text-align:left;">
            We received a request to sign in to your ${safeAppName} account. Select the button below to continue.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a class="cta-button" href="${safeUrl}" style="display:inline-block;line-height:1;text-decoration:none;color:#ffffff;background-color:#2563eb;padding:14px 28px;font-size:15px;font-weight:600;border-radius:6px;text-align:center;border:1px solid #1d4ed8;">
              Open sign-in link
            </a>
          </div>
          ${deviceDetails}
          <p style="font-size:13px;line-height:20px;margin:28px 0 0 0;color:#4b5563;text-align:left;padding:14px;border-radius:6px;border:1px solid #e5e7eb;background-color:#f9fafb;">
            <strong>Security reminder:</strong> This link expires in 15 minutes. If you did not request it, you can safely ignore this message.
          </p>
          <p style="font-size:14px;line-height:22px;margin:24px 0 0 0;color:#4b5563;text-align:left;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="font-size:12px;line-height:18px;margin:8px 0 0 0;color:#2563eb;text-align:left;word-break:break-all;padding:8px;background-color:#f3f4f6;border-radius:4px;">
            ${safeUrl}
          </p>
        </div>
        <div class="footer">
          <p style="font-size:12px;line-height:18px;margin:0 0 8px 0;color:#6b7280;text-align:center;">
            Sent to <a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;font-weight:500;">${safeEmail}</a>
          </p>
          <p style="font-size:12px;line-height:18px;margin:0;color:#9ca3af;text-align:center;">
            © ${currentYear} ${safeAppName}, ${safeCompanyName}. All rights reserved. | ${escapeHtml(formattedDate)}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function getDeviceDetailsHtml(deviceInfo?: DeviceInfo): string {
  if (!deviceInfo) {
    return "";
  }

  const { browser, os, location } = deviceInfo;
  const deviceLine = browser && os
    ? `<p style="font-size:14px;line-height:20px;color:#4b5563;margin:0 0 4px 0;"><strong>Device:</strong> ${escapeHtml(browser)} on ${escapeHtml(os)}</p>`
    : "";
  const locationLine = location
    ? `<p style="font-size:14px;line-height:20px;color:#4b5563;margin:0 0 4px 0;"><strong>Location:</strong> ${escapeHtml(location)} (approximate)</p>`
    : "";

  if (!deviceLine && !locationLine) {
    return "";
  }

  return `
    <div style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:14px;margin:24px 0;">
      <p style="font-size:14px;font-weight:600;color:#1f2937;margin:0 0 8px 0;">Sign-in request details</p>
      ${deviceLine}
      ${locationLine}
    </div>
  `.trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseDeviceInfo(request: Request): DeviceInfo {
  const { headers } = request;
  const { browser, os, device } = userAgent(request);

  const ip = (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for") ??
    "N/A"
  )
    .split(",")[0]
    .trim();

  const city = headers.get("cf-ipcity") ?? headers.get("x-vercel-ip-city");
  const country = headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country");
  const region = headers.get("cf-ipregioncode") ?? headers.get("x-vercel-ip-country-region");

  const locationParts = [city, region, country]
    .filter(Boolean)
    .map((part) => decodeURIComponent(part!));

  const location = locationParts.length > 0 ? locationParts.join(", ") : undefined;

  return {
    browser: browser.name,
    os: os.name,
    device:
      device?.type === "mobile"
        ? "Mobile"
        : device?.type === "tablet"
          ? "Tablet"
          : "Desktop",
    location,
    ip,
  };
}

export async function sendMagicLink(
  email: string,
  url: string,
  request?: Request,
) {
  try {
    const deviceInfo = request ? parseDeviceInfo(request) : undefined;

    await sendEmail(
      email,
      `Your secure sign-in link for ${APP_NAME}`,
      getMagicLinkEmailHTML(email, url, deviceInfo),
    );
  } catch (error) {
    console.error("Error sending magic link email with device info:", error);

    await sendEmail(
      email,
      `Your secure sign-in link for ${APP_NAME}`,
      getMagicLinkEmailHTML(email, url),
    );
  }
}
