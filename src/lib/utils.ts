import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Node } from "@markdoc/markdoc";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function renderMarkdoc(nodeOrNodes: Node | Node[]): string {
  if (Array.isArray(nodeOrNodes)) {
    return nodeOrNodes.map((n: Node) => renderMarkdoc(n)).join("");
  }

  const node = nodeOrNodes;

  if (typeof node === "string") {
    return node;
  }

  if (!node || typeof node !== "object") {
    return "";
  }

  // Handle text nodes
  if (node.type === "text" && typeof node.attributes?.content === "string") {
    return node.attributes.content;
  }

  // Handle nodes with children
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child: Node) => renderMarkdoc(child)).join("");
  }

  return "";
}

export function formatCurrency(
  amountInCents: number,
  currency: string = "USD",
): string {
  const amountInDollars = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInDollars);
}

export function calculateReadingTime(text: string): string {
  // Remove HTML tags
  const plainText = text.replace(/<[^>]+>/g, "");
  const wordsPerMinute = 200;
  const noOfWords = plainText
    .split(/\s/g)
    .filter((word) => word.length > 0).length;
  const minutes = noOfWords / wordsPerMinute;
  const readTime = Math.max(1, Math.ceil(minutes));

  return `${readTime} min read`;
}
