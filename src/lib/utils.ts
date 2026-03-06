import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { resolveIntlLocale } from "@/lib/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amountInCents: number,
  currency: string = "USD",
  locale?: string,
): string {
  const amountInDollars = amountInCents / 100;
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(amountInDollars);
}

export function calculateReadingTime(text: string): string {
  const plainText = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_~#>|-]/g, " ");
  const wordsPerMinute = 200;
  const noOfWords = plainText
    .split(/\s/g)
    .filter((word) => word.length > 0).length;
  const minutes = noOfWords / wordsPerMinute;
  const readTime = Math.max(1, Math.ceil(minutes));

  return `${readTime} min read`;
}
