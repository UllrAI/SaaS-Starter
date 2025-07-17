import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next/types";

import {
  AbsoluteTemplateString,
  DefaultTemplateString,
} from "next/dist/lib/metadata/types/metadata-types";

export function createMetadata(override: Metadata): Metadata {
  let title = APP_NAME;
  if (typeof override.title === "string") {
    title = override.title;
  } else if (
    override.title &&
    "absolute" in override.title &&
    (override.title as AbsoluteTemplateString).absolute
  ) {
    title = (override.title as AbsoluteTemplateString).absolute;
  } else if (
    override.title &&
    "default" in override.title &&
    (override.title as DefaultTemplateString).default
  ) {
    title = (override.title as DefaultTemplateString).default;
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
      locale: "en_US", // Default locale, can be overridden
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
