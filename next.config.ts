import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withContentCollections } from "@content-collections/next";
import { withLingo } from "@lingo.dev/compiler/next";
import env from "@/env";
import {
  SOURCE_LOCALE,
  TARGET_LOCALES,
  LINGO_MODEL_MAP,
  LINGO_PLURALIZATION_MODEL,
} from "@/lib/config/i18n";

(globalThis as typeof globalThis & { AI_SDK_LOG_WARNINGS?: false })
  .AI_SDK_LOG_WARNINGS = false;
process.env.DOTENV_CONFIG_QUIET = "true";

// Safely parse the R2 hostname.
let r2Hostname: string | undefined;
try {
  if (env.R2_PUBLIC_URL) {
    r2Hostname = new URL(env.R2_PUBLIC_URL).hostname;
  }
} catch {
  console.error(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `Warning: Invalid R2_PUBLIC_URL found in environment variables. Skipping R2 remote pattern.`,
  );
  r2Hostname = undefined;
}

const remotePatterns = [
  {
    protocol: "https" as const,
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https" as const,
    hostname: "unsplash.com",
  },
];

if (r2Hostname) {
  remotePatterns.push({
    protocol: "https" as const,
    hostname: r2Hostname,
  });
}

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns,
  },
};

export default async function createNextConfig(): Promise<NextConfig> {
  const buildMode =
    process.env.LINGO_BUILD_MODE === "cache-only" ? "cache-only" : "translate";
  const usePseudotranslator =
    process.env.NODE_ENV !== "production" &&
    process.env.LINGO_USE_PSEUDOTRANSLATOR !== "false";

  let config = await withLingo(nextConfig, {
    sourceRoot: "src",
    lingoDir: ".lingo",
    sourceLocale: SOURCE_LOCALE,
    targetLocales: [...TARGET_LOCALES],
    useDirective: false,
    models: LINGO_MODEL_MAP,
    dev: {
      usePseudotranslator,
    },
    pluralization: {
      enabled: false,
      model: LINGO_PLURALIZATION_MODEL,
    },
    buildMode,
  });

  // Enable the bundle analyzer only when explicitly requested.
  if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = nextBundleAnalyzer({
      enabled: true,
    });
    config = withBundleAnalyzer(config);
  }

  return (await withContentCollections(config)) as NextConfig;
}
