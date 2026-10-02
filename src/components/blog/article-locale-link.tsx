"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { SupportedLocale } from "@/lib/config/i18n";
import { persistLocale } from "@/lib/i18n/locale-client";

type ArticleLocaleLinkProps = ComponentPropsWithoutRef<"a"> & {
  locale: SupportedLocale;
};

export function ArticleLocaleLink({
  locale,
  onClick,
  ...props
}: ArticleLocaleLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) persistLocale(locale);
      }}
    />
  );
}
