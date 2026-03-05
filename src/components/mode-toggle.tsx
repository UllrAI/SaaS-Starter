"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

const THEME_ORDER = ["light", "dark", "system"] as const;

const THEME_META = {
  light: {
    label: "Light",
    icon: <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />,
  },
  dark: {
    label: "Dark",
    icon: <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />,
  },
  system: {
    label: "System",
    icon: <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />,
  },
} as const;

function resolveTheme(theme: string | undefined): keyof typeof THEME_META {
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
  const themeMeta = THEME_META[activeTheme];

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        {showLabel && <span className="ml-2">Light</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={cycleTheme}
      title={`Current theme: ${themeMeta.label}. Click to cycle themes.`}
    >
      {themeMeta.icon}
      {showLabel && <span className="ml-2">{themeMeta.label}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
