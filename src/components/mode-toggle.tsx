"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";
interface ModeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}
const THEME_ORDER = ["light", "dark", "system"] as const;
type ThemeKey = (typeof THEME_ORDER)[number];
function resolveTheme(theme: string | undefined): ThemeKey {
  return theme === "light" || theme === "dark" ? theme : "system";
}
function ThemeLabel({ theme }: { theme: ThemeKey }) {
  const { t } = useTranslation();
  switch (theme) {
    case "light":
      return <>{t("a6004ced2373", "Light")}</>;
    case "dark":
      return <>{t("992711608c27", "Dark")}</>;
    case "system":
      return <>{t("054cfb234633", "System")}</>;
    default:
      return null;
  }
}
function ThemeIcon({ theme }: { theme: ThemeKey }) {
  switch (theme) {
    case "light":
      return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />;
    case "dark":
      return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />;
    case "system":
      return <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />;
    default:
      return null;
  }
}
export function ModeToggle({
  className,
  variant = "outline",
  size = "icon",
  showLabel = false,
}: ModeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const cycleTheme = () => {
    const activeTheme = resolveTheme(theme);
    const currentIndex = THEME_ORDER.indexOf(activeTheme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  };
  const activeTheme = resolveTheme(theme);
  if (!isClient) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        {showLabel && (
          <span className="ml-2">
            <ThemeLabel theme="light" />
          </span>
        )}
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={cycleTheme}
    >
      <ThemeIcon theme={activeTheme} />
      {showLabel && (
        <span className="ml-2">
          <ThemeLabel theme={activeTheme} />
        </span>
      )}
      <span className="sr-only">{t("02cda586643c", "Toggle theme")}</span>
    </Button>
  );
}
