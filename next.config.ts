import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withContentCollections } from "@content-collections/next";
import { withLingo } from "@lingo.dev/compiler/next";
import { createLingoConfig } from "./lingo.config";
import { getRemotePatterns } from "./next-images.config";

(globalThis as typeof globalThis & { AI_SDK_LOG_WARNINGS?: false })
  .AI_SDK_LOG_WARNINGS = false;
process.env.DOTENV_CONFIG_QUIET = "true";

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

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
  let config = await withLingo(nextConfig, createLingoConfig());
  config = withOptionalBundleAnalyzer(config);

  return (await withContentCollections(config)) as NextConfig;
}
