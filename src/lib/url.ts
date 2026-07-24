import env from "@/env";

export const APP_ORIGIN = new URL(env.NEXT_PUBLIC_APP_URL).origin;

export function absoluteUrl(pathname = "/"): string {
  return new URL(pathname, `${APP_ORIGIN}/`).toString();
}
