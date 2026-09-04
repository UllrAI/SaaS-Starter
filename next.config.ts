import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withContentCollections } from "@content-collections/next";
import createNextIntlPlugin from "next-intl/plugin";
import { getRemotePatterns } from "./next-images.config";
import { PERMANENT_REDIRECTS } from "./src/lib/config/redirects";
import { version as packageVersion } from "./package.json";

const isDevelopment = process.env.NODE_ENV === "development";
const umamiScriptOrigin = (() => {
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  if (!scriptUrl) return null;

  try {
    return new URL(scriptUrl).origin;
  } catch {
    return null;
  }
})();
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}${umamiScriptOrigin ? ` ${umamiScriptOrigin}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https: wss:${umamiScriptOrigin ? ` ${umamiScriptOrigin}` : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
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

// Stamping the build with a deployment ID lets the router spot a stale client
// and fall back to a hard navigation before the user triggers a Server Action
// the server no longer knows. Releases are tagged `release/vX.Y.Z` to match the
// package version (see AGENTS.md "Production Promotion"), so that version marks
// exactly the deployments users see. The value has to be deterministic —
// `next build` loads this config in several processes and the ID compiled into
// the client must match the one frozen into the standalone server — and dots
// are stripped because `next build` rejects anything outside [A-Za-z0-9_-].
// `NEXT_DEPLOYMENT_ID` still overrides this, but Next applies it itself after
// this config is loaded, so its value has to satisfy that character set on its
// own.
const deploymentId = packageVersion.replace(/[^A-Za-z0-9_-]/g, "-");

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId,
  // The Vercel AI SDK ships ESM-only bundles; listing the packages here also
  // lets next/jest transform them so agent tools stay unit-testable.
  transpilePackages: [
    "ai",
    "@ai-sdk/openai",
    "@ai-sdk/react",
    "@ai-sdk/provider",
    "@ai-sdk/provider-utils",
    // Transitive ESM-only deps of `ai` that Jest must transform too.
    "@ai-sdk/gateway",
    "@workflow/serde",
    "pg-boss",
    "serialize-error",
    "non-error",
    "cron-parser",
    "@shadcn/helpers",
    "@shadcn/react",
  ],
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
  async redirects() {
    return PERMANENT_REDIRECTS;
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
