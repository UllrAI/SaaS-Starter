// Store an authenticated application URL, never a long-lived object credential.
export function buildFileUrl(key: string): string {
  return `/api/files/content?key=${encodeURIComponent(key)}`;
}
