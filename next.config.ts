import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withContentCollections } from "@content-collections/next";
import createNextIntlPlugin from "next-intl/plugin";
import { getRemotePatterns } from "./next-images.config";

(
  globalThis as typeof globalThis & { AI_SDK_LOG_WARNINGS?: false }
).AI_SDK_LOG_WARNINGS = false;
process.env.DOTENV_CONFIG_QUIET = "true";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isDevelopment
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function withOptionalBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") {
    return config;
  }

  const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: true,
  });

  return withBundleAnalyzer(config);
}

export default async function createNextConfig(): Promise<NextConfig> {
  let config = withNextIntl(nextConfig);
  config = withOptionalBundleAnalyzer(config);

  return (await withContentCollections(config)) as NextConfig;
}
