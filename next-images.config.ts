import env from "./env";

type RemotePattern = {
  protocol: "https";
  hostname: string;
};

const DEFAULT_REMOTE_PATTERNS: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "unsplash.com",
  },
];

function resolveR2Hostname(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    console.error(
      "\x1b[33m%s\x1b[0m",
      "Warning: Invalid R2_PUBLIC_URL found in environment variables. Skipping R2 remote pattern.",
    );
    return undefined;
  }
}

export function getRemotePatterns(): RemotePattern[] {
  const r2Hostname = resolveR2Hostname(env.R2_PUBLIC_URL);

  if (!r2Hostname) {
    return [...DEFAULT_REMOTE_PATTERNS];
  }

  return [
    ...DEFAULT_REMOTE_PATTERNS,
    {
      protocol: "https",
      hostname: r2Hostname,
    },
  ];
}
