import type { ReactNode } from "react";
import { isValidElement } from "react";
import { userAgent } from "next/server";
import { sendEmail } from "@/lib/email";
import { APP_NAME, COMPANY_NAME } from "@/lib/config/constants";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
  SOURCE_LOCALE,
  resolvePreferredLocale,
} from "@/lib/config/i18n-routing";
import type { SupportedLocale } from "@/lib/config/i18n";
import { resolveIntlLocale } from "@/lib/locale";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import {
  type MagicLinkEmailCopy,
  type MagicLinkEmailDeviceInfo,
  renderMagicLinkEmail,
} from "@/emails/magic-link-email";
import { MAGIC_LINK_TTL_SECONDS } from "@/lib/auth/constants";

type DeviceInfo = MagicLinkEmailDeviceInfo;

async function resolveText(node: Promise<ReactNode> | ReactNode) {
  return extractTextContent(await node).trim();
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }

  if (isValidElement(node)) {
    return extractTextContent(
      (node.props as { children?: ReactNode }).children ?? null,
    );
  }

  return "";
}

function getCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookiePair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookiePair) {
    return null;
  }

  const rawValue = cookiePair.split("=")[1];
  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return null;
  }
}

function resolveMagicLinkLocale(request?: Request): SupportedLocale {
  if (!request) {
    return SOURCE_LOCALE;
  }

  const headerLocale = request.headers.get(LOCALE_HEADER_NAME);
  const cookieLocale = getCookieValue(
    request.headers.get("cookie"),
    LOCALE_COOKIE_NAME,
  );

  return resolvePreferredLocale({
    cookieLocale: headerLocale ?? cookieLocale,
    acceptLanguage: request.headers.get("accept-language"),
  });
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
  const country =
    headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country");
  const region =
    headers.get("cf-ipregioncode") ?? headers.get("x-vercel-ip-country-region");

  const locationParts = [city, region, country]
    .filter(Boolean)
    .map((part) => decodeURIComponent(part!));

  const location =
    locationParts.length > 0 ? locationParts.join(", ") : undefined;

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

async function createMagicLinkEmailCopy({
  appName,
  companyName,
  currentYear,
  formattedDate,
  deviceInfo,
  locale,
}: {
  appName: string;
  companyName: string;
  currentYear: number;
  formattedDate: string;
  deviceInfo?: DeviceInfo;
  locale: SupportedLocale;
}): Promise<MagicLinkEmailCopy> {
  const { t } = await getServerTranslations({ locale });

  const preview = await resolveText(
    t(
      "email_click_secure_button_below_complete_sign",
      "Click the secure button below to complete your sign-in process. Your secure sign-in link for {appName}",
      { appName },
    ),
  );
  const requestDetails = await resolveText(
    t(
      "email_we_received_request_sign_in_account",
      "We received a request to sign in to your {appName} account. Select the button below to continue.",
      { appName },
    ),
  );
  const footer = await resolveText(
    t(
      "email_all_rights_reserved",
      "© {currentYear}{appName}, {companyName}. All rights reserved. | {formattedDate}",
      {
        currentYear,
        appName,
        companyName,
        formattedDate,
      },
    ),
  );
  const deviceLine =
    deviceInfo?.browser && deviceInfo.os
      ? await resolveText(
          t("email_device", "Device: {browser} on {os}", {
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          }),
        )
      : "";
  const locationLine = deviceInfo?.location
    ? await resolveText(
        t("email_location_approximate", "Location: {location} (approximate)", {
          location: deviceInfo.location,
        }),
      )
    : "";

  return {
    preview,
    heading: t("email_access_account_securely", "Access your account securely"),
    intro: t(
      "email_use_link_below_finish_signing_in",
      "Use the link below to finish signing in.",
    ),
    greeting: t("email_hello", "Hello,"),
    requestDetails,
    cta: t("email_open_sign_in_link", "Open sign-in link"),
    securityReminder: await resolveText(
      t(
        "email_security_reminder_link_expires_in_minutes",
        "Security reminder: This link expires in {minutes} minutes. If you did not request it, you can safely ignore this message.",
        { minutes: MAGIC_LINK_TTL_SECONDS / 60 },
      ),
    ),
    fallback: t(
      "email_if_button_doesnt_work_you_can",
      "If the button doesn't work, you can copy and paste this link into your browser:",
    ),
    sentToLabel: t("email_sent", "Sent to"),
    footer,
    deviceDetailsTitle:
      deviceInfo?.browser || deviceInfo?.location
        ? t("email_sign_in_request_details", "Sign-in request details")
        : undefined,
    deviceLine: deviceLine || undefined,
    locationLine: locationLine || undefined,
  };
}

export async function sendMagicLink(
  email: string,
  url: string,
  request?: Request,
) {
  const locale = resolveMagicLinkLocale(request);
  const now = new Date();
  const formattedDate = now.toLocaleDateString(resolveIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deviceInfo = request ? parseDeviceInfo(request) : undefined;

  try {
    const [{ t }, copy] = await Promise.all([
      getServerTranslations({ locale }),
      createMagicLinkEmailCopy({
        appName: APP_NAME,
        companyName: COMPANY_NAME,
        currentYear: now.getFullYear(),
        formattedDate,
        deviceInfo,
        locale,
      }),
    ]);
    const subject = await resolveText(
      t("email_secure_sign_in_link", "Your secure sign-in link for {appName}", {
        appName: APP_NAME,
      }),
    );

    const body = await renderMagicLinkEmail({
      copy,
      email,
      url,
      appName: APP_NAME,
      locale,
    });

    await sendEmail(email, subject, body);
  } catch (error) {
    console.error("Error sending magic link email with device info:", error);
    throw error;
  }
}
