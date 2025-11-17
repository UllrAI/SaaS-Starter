"use client";

import * as React from "react";
import { Languages, Check, Loader2 } from "lucide-react";
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
import {
  setLingoLocale,
  useLingoLocale,
} from "lingo.dev/react/client";

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

export function LocaleSwitcher({
  locales = SUPPORTED_LOCALES,
  className,
  variant = "ghost",
  size = "icon",
  align = "end",
  showLabel = false,
}: LocaleSwitcherProps) {
  const availableLocales =
    locales.length > 0 ? locales : SUPPORTED_LOCALES;
  const localeFromCookie = useLingoLocale();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const activeLocale = React.useMemo<SupportedLocale>(() => {
    if (localeFromCookie) {
      const match = availableLocales.find(
        (locale) => locale === localeFromCookie,
      );
      if (match) {
        return match;
      }
    }
    return availableLocales[0];
  }, [availableLocales, localeFromCookie]);

  const handleLocaleSelect = (locale: SupportedLocale) => {
    if (locale === activeLocale || isSwitching) {
      return;
    }
    setIsSwitching(true);
    setLingoLocale(locale);
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
          className={cn(
            "gap-2",
            showLabel && size !== "icon" && "px-3",
            showLabel && size === "sm" && "h-9",
            className,
          )}
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />
          ) : (
            <Languages className="h-[1.2rem] w-[1.2rem]" />
          )}
          {showLabel && (
            <span className="text-sm font-medium">
              {activeLocaleDetails.label}
            </span>
          )}
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="min-w-[12rem]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLocales.map((locale) => {
          const details = getLocaleDisplayInfo(locale);
          const isSelected = locale === activeLocale;

          return (
            <DropdownMenuItem
              key={locale}
              className="flex items-center justify-between gap-4 py-2"
              onSelect={() => handleLocaleSelect(locale)}
            >
              <span className="text-sm font-medium leading-none">
                {details.label}
              </span>
              {isSelected && (
                <Check className="text-primary h-4 w-4" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
