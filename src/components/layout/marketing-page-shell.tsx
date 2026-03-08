import type { ComponentPropsWithoutRef } from "react";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { cn } from "@/lib/utils";
import { SectionContainer } from "./page-container";

interface MarketingPageShellProps extends ComponentPropsWithoutRef<"section"> {
  containerClassName?: string;
  contentClassName?: string;
}

export function MarketingPageShell({
  children,
  className,
  containerClassName,
  contentClassName,
  ...props
}: MarketingPageShellProps) {
  return (
    <section className={cn("flex min-h-screen flex-col", className)} {...props}>
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />
        <div className={cn("relative py-16", contentClassName)}>
          <SectionContainer className={containerClassName}>
            {children}
          </SectionContainer>
        </div>
      </div>
    </section>
  );
}
