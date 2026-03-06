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
import {
  MagicLinkEmailCta,
  MagicLinkEmailDeviceDetailsTitle,
  MagicLinkEmailDeviceLine,
  MagicLinkEmailFallback,
  MagicLinkEmailFooter,
  MagicLinkEmailGreeting,
  MagicLinkEmailHeading,
  type MagicLinkEmailCopy,
  MagicLinkEmailSubject,
  MagicLinkEmailPreview,
  MagicLinkEmailIntro,
  MagicLinkEmailLocationLine,
  MagicLinkEmailRequestDetails,
  MagicLinkEmailSecurityReminder,
  MagicLinkEmailSentToLabel,
  type MagicLinkEmailDeviceInfo,
  renderMagicLinkEmail,
} from "@/emails/magic-link-email";

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

function getCookieValue(cookieHeader: string | null, name: string): string | null {
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
}: {
  appName: string;
  companyName: string;
  currentYear: number;
  formattedDate: string;
  deviceInfo?: DeviceInfo;
}): Promise<MagicLinkEmailCopy> {
  const [
    preview,
    heading,
    intro,
    greeting,
    requestDetails,
    cta,
    securityReminder,
    fallback,
    sentToLabel,
    footer,
    deviceDetailsTitle,
    deviceLine,
    locationLine,
  ] = await Promise.all([
    resolveText(MagicLinkEmailPreview({ appName })),
    resolveText(MagicLinkEmailHeading()),
    resolveText(MagicLinkEmailIntro()),
    resolveText(MagicLinkEmailGreeting()),
    resolveText(MagicLinkEmailRequestDetails({ appName })),
    resolveText(MagicLinkEmailCta()),
    resolveText(MagicLinkEmailSecurityReminder()),
    resolveText(MagicLinkEmailFallback()),
    resolveText(MagicLinkEmailSentToLabel()),
    resolveText(
      MagicLinkEmailFooter({
        currentYear,
        appName,
        companyName,
        formattedDate,
      }),
    ),
    deviceInfo?.browser || deviceInfo?.location
      ? resolveText(MagicLinkEmailDeviceDetailsTitle())
      : Promise.resolve(""),
    deviceInfo?.browser && deviceInfo.os
      ? resolveText(
          MagicLinkEmailDeviceLine({
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          }),
        )
      : Promise.resolve(""),
    deviceInfo?.location
      ? resolveText(
          MagicLinkEmailLocationLine({
            location: deviceInfo.location,
          }),
        )
      : Promise.resolve(""),
  ]);

  return {
    preview,
    heading,
    intro,
    greeting,
    requestDetails,
    cta,
    securityReminder,
    fallback,
    sentToLabel,
    footer,
    deviceDetailsTitle: deviceDetailsTitle || undefined,
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
    const [subject, copy] = await Promise.all([
      resolveText(MagicLinkEmailSubject({ appName: APP_NAME })),
      createMagicLinkEmailCopy({
        appName: APP_NAME,
        companyName: COMPANY_NAME,
        currentYear: now.getFullYear(),
        formattedDate,
        deviceInfo,
      }),
    ]);

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
