import "server-only";

import type { Metadata } from "next";
import { isValidElement, type ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";

type MetadataCopyComponent = () => ReactNode | Promise<ReactNode>;
type MetadataText = string | MetadataCopyComponent;
type MetadataTitleInput =
  | MetadataText
  | {
      default?: MetadataText;
      absolute?: MetadataText;
      template?: string | null;
    };

type MetadataOverrideInput = Omit<Metadata, "title" | "description" | "keywords"> & {
  title?: MetadataTitleInput;
  description?: MetadataText;
  keywords?: MetadataText[];
};

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }

  if (isValidElement(node)) {
    return extractTextContent((node.props as { children?: ReactNode }).children);
  }

  return "";
}

async function resolveMetadataText(value?: MetadataText): Promise<string | undefined> {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return extractTextContent(await value());
}

async function resolveMetadataTitle(
  title?: MetadataTitleInput,
): Promise<Metadata["title"] | undefined> {
  if (!title) {
    return undefined;
  }

  if (typeof title === "string" || typeof title === "function") {
    return resolveMetadataText(title);
  }

  const resolvedTitle: {
    default?: string;
    absolute?: string | null;
    template?: string;
  } = {};
  const defaultTitle = await resolveMetadataText(title.default);
  const absoluteTitle = await resolveMetadataText(title.absolute);

  if (defaultTitle !== undefined) {
    resolvedTitle.default = defaultTitle;
  }

  if (absoluteTitle !== undefined) {
    resolvedTitle.absolute = absoluteTitle;
  }

  if (title.template !== null && title.template !== undefined) {
    resolvedTitle.template = title.template;
  }

  return resolvedTitle as Metadata["title"];
}

export async function createPageMetadata(
  metadata: MetadataOverrideInput,
): Promise<Metadata> {
  const keywords = metadata.keywords
    ? (await Promise.all(metadata.keywords.map(resolveMetadataText))).filter(
        (value): value is string => value !== undefined,
      )
    : undefined;

  return createMetadata({
    ...metadata,
    title: await resolveMetadataTitle(metadata.title),
    description: await resolveMetadataText(metadata.description),
    keywords,
  });
}
