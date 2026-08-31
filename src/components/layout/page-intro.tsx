import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageIntroProps extends ComponentPropsWithoutRef<"header"> {
  badge?: ReactNode;
}

export function PageIntro({
  badge,
  className,
  children,
  ...props
}: PageIntroProps) {
  return (
    <header className={cn("max-w-3xl text-left", className)} {...props}>
      {badge ? <div className="mb-6">{badge}</div> : null}
      {children}
    </header>
  );
}

export function PageIntroHeading({
  as: Component = "h1",
  className,
  ...props
}: ComponentPropsWithoutRef<"h1"> & {
  as?: "h1" | "h2";
}) {
  return (
    <Component
      className={cn(
        "text-foreground mb-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl",
        className,
      )}
      {...props}
    />
  );
}

export function PageIntroDescription(props: ComponentPropsWithoutRef<"p">) {
  const { className, ...rest } = props;

  return (
    <p
      className={cn(
        "text-muted-foreground max-w-2xl text-lg leading-8",
        className,
      )}
      {...rest}
    />
  );
}
