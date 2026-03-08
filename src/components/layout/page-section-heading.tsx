import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionHeadingProps extends ComponentPropsWithoutRef<"div"> {
  icon?: ReactNode;
}

export function PageSectionHeading({
  icon,
  children,
  className,
  ...props
}: PageSectionHeadingProps) {
  return (
    <div
      className={cn("mb-10 flex items-center gap-2 border-b pb-4", className)}
      {...props}
    >
      {icon}
      <h2 className="text-2xl font-bold">{children}</h2>
    </div>
  );
}
