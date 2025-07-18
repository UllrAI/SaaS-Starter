import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { sendEmail } from "@/lib/email";
import { APP_NAME, COMPANY_NAME } from "@/lib/config/constants";
import { userAgent } from "next/server";

interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  ip?: string; // We keep IP in the data structure for potential logging, but won't show it in the email.
}

// MagicLinkEmailBody component is updated to NOT show the IP address.
const MagicLinkEmailBody = ({
  email,
  url,
  deviceInfo,
}: {
  email: string;
  url: string;
  deviceInfo?: DeviceInfo;
}) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <style>
          {`
            * {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              box-sizing: border-box;
            }

            blockquote,h1,h2,h3,img,li,ol,p,ul {
              margin-top: 0;
              margin-bottom: 0;
            }

            .email-wrapper {
              background-color: #f8fafc;
              padding: 40px 20px;
            }

            .email-content {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }

            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 32px 40px;
              text-align: center;
            }

            .content {
              padding: 40px;
            }

            .footer {
              background-color: #f8fafc;
              padding: 24px 40px;
              border-top: 1px solid #e2e8f0;
            }

            @media only screen and (max-width: 600px) {
              .email-wrapper {
                padding: 20px 10px;
              }
              .header, .content, .footer {
                padding-left: 24px;
                padding-right: 24px;
              }
              .header {
                padding-top: 24px;
                padding-bottom: 24px;
              }
              .content {
                padding-top: 32px;
                padding-bottom: 32px;
              }
              h1 {
                font-size: 24px !important;
                line-height: 32px !important;
              }
              p, a {
                font-size: 14px !important;
                line-height: 22px !important;
              }
              .cta-button {
                font-size: 16px !important;
                padding: 14px 28px !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>
        Click the secure button below to complete your sign-in process. Your
        secure sign-in link for {APP_NAME}
      </Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f8fafc",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div className="email-wrapper">
          <Container
            className="email-content"
            style={{
              maxWidth: "600px",
              width: "100%",
              margin: "0 auto",
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Header */}
            <div className="header">
              <Heading
                as="h1"
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  lineHeight: "36px",
                  color: "#ffffff",
                  margin: "0",
                  textAlign: "center",
                }}
              >
                Welcome to {APP_NAME}
              </Heading>
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#e2e8f0",
                  margin: "8px 0 0 0",
                  textAlign: "center",
                }}
              >
                Your secure sign-in link is ready
              </Text>
            </div>

            {/* Main Content */}
            <div className="content">
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 24px 0",
                  color: "#374151",
                  textAlign: "left",
                }}
              >
                Hello,
              </Text>

              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 24px 0",
                  color: "#374151",
                  textAlign: "left",
                }}
              >
                We received a request to sign in to your {APP_NAME} account.
                Click the secure button below to complete your sign-in process.
              </Text>

              {/* CTA Button */}
              <div style={{ textAlign: "center", margin: "32px 0" }}>
                <Link
                  className="cta-button"
                  style={{
                    display: "inline-block",
                    lineHeight: "1",
                    textDecoration: "none",
                    color: "#ffffff",
                    backgroundColor: "#4f46e5",
                    padding: "16px 32px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "8px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                  href={url}
                >
                  Sign In to {APP_NAME}
                </Link>
              </div>

              {/* Device and Location Info */}
              {deviceInfo && (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px",
                    margin: "24px 0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Sign-in Request Details:
                  </Text>
                  {deviceInfo.browser && deviceInfo.os && (
                    <Text
                      style={{
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "#6b7280",
                        margin: "0 0 4px 0",
                      }}
                    >
                      <strong>Device:</strong> {deviceInfo.browser} on{" "}
                      {deviceInfo.os}
                    </Text>
                  )}
                  {deviceInfo.location && (
                    <Text
                      style={{
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "#6b7280",
                        margin: "0 0 4px 0",
                      }}
                    >
                      <strong>Location:</strong> {deviceInfo.location}{" "}
                      (approximate)
                    </Text>
                  )}
                  {/* IP address rendering has been removed as requested. */}
                </div>
              )}

              <Text
                style={{
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: "32px 0 0 0",
                  color: "#6b7280",
                  textAlign: "center",
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <strong>Security Notice:</strong> This link will expire in 15
                minutes for your security. If you didn&apos;t request this
                sign-in, please ignore this email.
              </Text>

              <Text
                style={{
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: "24px 0 0 0",
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                If the button doesn&apos;t work, you can copy and paste this
                link into your browser:
              </Text>

              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: "8px 0 0 0",
                  color: "#4f46e5",
                  textAlign: "left",
                  wordBreak: "break-all",
                  padding: "8px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "4px",
                }}
              >
                {url}
              </Text>
            </div>

            {/* Footer */}
            <div className="footer">
              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: "0 0 8px 0",
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                This email was sent to{" "}
                <Link
                  href={`mailto:${email}`}
                  style={{
                    color: "#4f46e5",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  {email}
                </Link>
              </Text>

              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: "0",
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                © {new Date().getFullYear()} {APP_NAME}, {COMPANY_NAME}. All
                rights reserved. | {currentDate}
              </Text>
            </div>
          </Container>
        </div>
      </Body>
    </Html>
  );
};

/**
 * Parses device, IP, and geo information from the request object in a runtime-agnostic way.
 * This version is compatible with both Vercel and Cloudflare.
 * @param request The incoming Request object.
 * @returns An object with device information.
 */
function parseDeviceInfo(request: Request): DeviceInfo {
  const { headers } = request;

  // 1. Parse User-Agent using the performant, lazy-loaded userAgent function
  const { browser, os, device } = userAgent(request);

  // 2. Safely get IP address, prioritizing Cloudflare's header.
  const ip = (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for") ??
    "N/A"
  )
    .split(",")[0]
    .trim();

  // 3. Safely get Geo location from Cloudflare- and Vercel-specific headers.
  const city = headers.get("cf-ipcity") ?? headers.get("x-vercel-ip-city");
  const country =
    headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country");
  const region =
    headers.get("cf-ipregioncode") ?? headers.get("x-vercel-ip-country-region");

  // 4. Construct the location string from available geo data.
  let location: string | undefined;
  const locationParts = [city, region, country]
    .filter(Boolean)
    .map((part) => decodeURIComponent(part!));

  if (locationParts.length > 0) {
    location = locationParts.join(", ");
  }

  return {
    browser: browser.name,
    os: os.name,
    device:
      device.type === "mobile"
        ? "Mobile"
        : device.type === "tablet"
          ? "Tablet"
          : "Desktop",
    location,
    ip, // IP is still available in the returned object for other uses (e.g. logging)
  };
}

export async function sendMagicLink(
  email: string,
  url: string,
  request?: Request,
) {
  try {
    // The request object is optional, so handle the case where it might not exist.
    const deviceInfo = request ? parseDeviceInfo(request) : undefined;

    await sendEmail(
      email,
      `Your secure sign-in link for ${APP_NAME}`,
      <MagicLinkEmailBody email={email} url={url} deviceInfo={deviceInfo} />,
    );
  } catch (error) {
    // Log the error but don't re-throw, as failing to send device info
    // should not prevent the magic link email from being sent.
    console.error("Error sending magic link email with device info:", error);

    // As a fallback, send the email without device info
    await sendEmail(
      email,
      `Your secure sign-in link for ${APP_NAME}`,
      <MagicLinkEmailBody email={email} url={url} />,
    );
  }
}
