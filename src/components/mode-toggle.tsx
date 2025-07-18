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
    const themes = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme || "light");
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />;
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />;
      case "system":
      default:
        return <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
      default:
        return "System";
    }
  };

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
      title={`Current theme: ${getThemeLabel()}. Click to cycle themes.`}
    >
      {getThemeIcon()}
      {showLabel && <span className="ml-2">{getThemeLabel()}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
