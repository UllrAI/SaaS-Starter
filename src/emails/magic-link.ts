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
      "80b889e83a0f",
      "Click the secure button below to complete your sign-in process. Your secure sign-in link for {appName}",
      { appName },
    ),
  );
  const requestDetails = await resolveText(
    t(
      "414469cce093",
      "We received a request to sign in to your {appName} account. Select the button below to continue.",
      { appName },
    ),
  );
  const footer = await resolveText(
    t(
      "c99d7d8ebb54",
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
          t("5b8ceb90d76a", "Device: {browser} on {os}", {
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          }),
        )
      : "";
  const locationLine = deviceInfo?.location
    ? await resolveText(
        t("78a42b99e1c7", "Location: {location} (approximate)", {
          location: deviceInfo.location,
        }),
      )
    : "";

  return {
    preview,
    heading: t("e0193ab6916d", "Access your account securely"),
    intro: t("580361ef9c77", "Use the link below to finish signing in."),
    greeting: t("c1e7f10203d5", "Hello,"),
    requestDetails,
    cta: t("41a27364d337", "Open sign-in link"),
    securityReminder: await resolveText(
      t(
        "5b8eb59cbe7a",
        "Security reminder: This link expires in {minutes} minutes. If you did not request it, you can safely ignore this message.",
        { minutes: MAGIC_LINK_TTL_SECONDS / 60 },
      ),
    ),
    fallback: t(
      "79f9112819d8",
      "If the button doesn't work, you can copy and paste this link into your browser:",
    ),
    sentToLabel: t("47e283e92be3", "Sent to"),
    footer,
    deviceDetailsTitle:
      deviceInfo?.browser || deviceInfo?.location
        ? t("eef4d90780f4", "Sign-in request details")
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
      t("7f6896e52a0f", "Your secure sign-in link for {appName}", {
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
