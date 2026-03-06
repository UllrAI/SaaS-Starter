"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { defineCopyCatalog } from "@/lib/i18n/copy-catalog";

interface ModeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

const THEME_ORDER = ["light", "dark", "system"] as const;
type ThemeKey = (typeof THEME_ORDER)[number];

const THEME_COPY = defineCopyCatalog([
  {
    id: "light",
    Label: function ThemeLabelLight() {
      return <>Light</>;
    },
    Icon: Sun,
  },
  {
    id: "dark",
    Label: function ThemeLabelDark() {
      return <>Dark</>;
    },
    Icon: Moon,
  },
  {
    id: "system",
    Label: function ThemeLabelSystem() {
      return <>System</>;
    },
    Icon: Monitor,
  },
] satisfies ReadonlyArray<{
  id: ThemeKey;
  Label: React.ComponentType;
  Icon: React.ComponentType<{ className?: string }>;
}>);

function resolveTheme(theme: string | undefined): ThemeKey {
  return theme === "light" || theme === "dark" ? theme : "system";
}

export function ModeToggle({
  className,
  variant = "outline",
  size = "icon",
  showLabel = false,
}: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const activeTheme = resolveTheme(theme);
    const currentIndex = THEME_ORDER.indexOf(activeTheme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  };

  const activeTheme = resolveTheme(theme);
  const ActiveThemeLabel = THEME_COPY.get(activeTheme).Label;
  const ActiveThemeIcon = THEME_COPY.get(activeTheme).Icon;
  const FallbackThemeLabel = THEME_COPY.get("light").Label;

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        {showLabel && (
          <span className="ml-2">
            <FallbackThemeLabel />
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
      <ActiveThemeIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
      {showLabel && (
        <span className="ml-2">
          <ActiveThemeLabel />
        </span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
