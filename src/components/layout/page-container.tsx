import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = ComponentPropsWithoutRef<"div">;

const containerWidthClasses = {
  shell: "max-w-7xl",
  section: "max-w-6xl",
  reading: "max-w-5xl",
  focus: "max-w-3xl",
  compact: "max-w-md",
} as const;

type ContainerWidth = keyof typeof containerWidthClasses;

// Keep container choices small and semantic so page code does not fall back to ad hoc max-w classes.
function BaseContainer({
  width,
  className,
  ...props
}: ContainerProps & {
  width: ContainerWidth;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        containerWidthClasses[width],
        className,
      )}
      {...props}
    />
  );
}

export function ShellContainer(props: ContainerProps) {
  return <BaseContainer width="shell" {...props} />;
}

export function SectionContainer(props: ContainerProps) {
  return <BaseContainer width="section" {...props} />;
}

export function ReadingContainer(props: ContainerProps) {
  return <BaseContainer width="reading" {...props} />;
}

export function CompactContainer(props: ContainerProps) {
  return <BaseContainer width="compact" {...props} />;
}

export function FocusContainer(props: ContainerProps) {
  return <BaseContainer width="focus" {...props} />;
}

// Temporary alias for older imports. Prefer semantic container names in new code.
export const SiteContainer = ShellContainer;
