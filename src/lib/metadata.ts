import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";

export function createMetadata(override: Metadata): Metadata {
  // 处理 title
  let title = APP_NAME;

  if (override.title) {
    if (typeof override.title === "string") {
      title = override.title;
    } else if (typeof override.title === "object" && override.title !== null) {
      const titleObj = override.title as Record<string, string | null | undefined>;
      title = titleObj.absolute || titleObj.default || APP_NAME;
    }
  }

  const description = override.description || "";

  return {
    ...override,
    openGraph: {
      title: override.openGraph?.title ?? title,
      description: override.openGraph?.description ?? description,
      url: env.NEXT_PUBLIC_APP_URL,
      images: override.openGraph?.images ?? OGIMAGE,
      siteName: APP_NAME,
      type: "website",
      locale: "en_US",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: override.twitter?.title ?? title,
      description: override.twitter?.description ?? description,
      images: override.twitter?.images ?? OGIMAGE,
      ...override.twitter,
    },
    metadataBase: override.metadataBase ?? new URL(env.NEXT_PUBLIC_APP_URL),
  };
}