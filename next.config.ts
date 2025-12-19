import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import lingoCompiler from "lingo.dev/compiler";
import env from "@/env";
import {
  SOURCE_LOCALE,
  TARGET_LOCALES,
  LINGO_MODEL_MAP,
} from "@/lib/config/i18n";

// Safely parse the R2 hostname
let r2Hostname: string | undefined;
try {
  if (env.R2_PUBLIC_URL) {
    r2Hostname = new URL(env.R2_PUBLIC_URL).hostname;
  }
} catch (error) {
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

const withLingo = lingoCompiler.next({
  sourceRoot: "src/app",
  lingoDir: "lingo",
  sourceLocale: SOURCE_LOCALE,
  targetLocales: [...TARGET_LOCALES],
  rsc: true,
  useDirective: false,
  debug: false,
  models: LINGO_MODEL_MAP,
});

let config = withLingo(nextConfig);

// 只有在 process.env.ANALYZE 为 'true' 时才启用 bundle analyzer
if (process.env.ANALYZE === "true") {
  const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: true,
  });
  config = withBundleAnalyzer(config);
}

export default config;
