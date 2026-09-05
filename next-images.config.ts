type RemotePattern = {
  protocol: "https";
  hostname: string;
};

const CONTENT_IMAGE_PATTERNS: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
];

// Private user files are rendered unoptimized through their authenticated URL.
export function getRemotePatterns(): RemotePattern[] {
  return [...CONTENT_IMAGE_PATTERNS];
}
