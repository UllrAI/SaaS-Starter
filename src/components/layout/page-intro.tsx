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
    <header
      className={cn("mx-auto max-w-3xl text-center", className)}
      {...props}
    >
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
        "text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl",
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
      className={cn("text-muted-foreground text-xl leading-relaxed", className)}
      {...rest}
    />
  );
}
