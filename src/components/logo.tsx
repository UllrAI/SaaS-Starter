import { cn } from "@/lib/utils";
import { BowArrow, LucideIcon } from "lucide-react";
import React from "react";

// Default logo icon - can be easily changed here
const DEFAULT_LOGO_ICON = BowArrow;

type LogoVariant = "default" | "minimal" | "icon-only";

interface LogoProps {
  className?: string;
  icon?: LucideIcon;
  variant?: LogoVariant;
  iconClassName?: string;
}

export function Logo({
  className,
  icon: Icon = DEFAULT_LOGO_ICON,
  variant = "default",
  iconClassName,
}: LogoProps) {
  const baseClasses = "flex items-center justify-center";

  const variantClasses = {
    default: "h-full w-full rounded-lg bg-primary p-2.5",
    minimal: "h-full w-full rounded-md bg-primary/10 p-2",
    "icon-only": "h-full w-full",
  };

  const iconClasses = {
    default: "h-full w-full text-background",
    minimal: "h-full w-full text-primary",
    "icon-only": "h-full w-full text-current",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <Icon className={cn(iconClasses[variant], iconClassName)} />
    </div>
  );
}
