"use client";

import * as React from "react";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  getLocaleDisplayInfo,
} from "@/lib/config/i18n";
import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";
import { persistLocale } from "@/lib/i18n/locale-client";
import { resolveLocaleSwitchUrl } from "@/lib/i18n/locale-switch";
import { useLingoContext } from "@lingo.dev/compiler/react";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];
type ButtonSize = React.ComponentProps<typeof Button>["size"];

export type LocaleSwitcherProps = {
  locales?: readonly SupportedLocale[];
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: "start" | "center" | "end";
  showLabel?: boolean;
};

function getMarketingLocaleHref(locale: SupportedLocale): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return resolveLocaleSwitchUrl({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    locale,
  });
}

export function LocaleSwitcher({
  locales = SUPPORTED_LOCALES,
  className,
  variant = "ghost",
  size = "icon",
  align = "end",
  showLabel = false,
}: LocaleSwitcherProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const availableLocales = locales.length > 0 ? locales : SUPPORTED_LOCALES;
  const { locale: currentLocale, setLocale } = useLingoContext();
  const normalizedCurrentLocale = normalizeLocaleCandidate(currentLocale);
  const activeLocale = normalizedCurrentLocale ?? availableLocales[0];

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLocaleSelect = (locale: SupportedLocale) => {
    if (normalizedCurrentLocale && locale === normalizedCurrentLocale) {
      return;
    }

    startTransition(() => {
      void setLocale(locale);
    });
  };

  if (!availableLocales.length) {
    return null;
  }

  const activeLocaleDetails = getLocaleDisplayInfo(activeLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isPending}
          className={cn(
            "gap-2",
            showLabel && size !== "icon" && "px-3",
            showLabel && size === "sm" && "h-9",
            className,
          )}
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          {showLabel && (
            <span className="text-sm font-medium">
              {activeLocaleDetails.nativeName}
            </span>
          )}
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="min-w-[12rem]"
      >
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLocales.map((locale) => {
          const details = getLocaleDisplayInfo(locale);
          const isSelected = locale === activeLocale;
          const localeHref = isMounted ? getMarketingLocaleHref(locale) : null;

          if (localeHref && !isSelected) {
            return (
              <DropdownMenuItem key={locale} asChild className="py-2">
                <a
                  href={localeHref}
                  className="flex w-full items-center justify-between gap-4"
                  onClick={() => persistLocale(locale)}
                >
                  <span className="text-sm leading-none font-medium">
                    {details.nativeName}
                  </span>
                </a>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={locale}
              className="flex items-center justify-between gap-4 py-2"
              disabled={isPending || isSelected}
              onClick={() => handleLocaleSelect(locale)}
            >
              <span className="text-sm leading-none font-medium">
                {details.nativeName}
              </span>
              {isSelected && <Check className="text-primary h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
