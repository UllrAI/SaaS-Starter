import { cn } from "@/lib/utils";

export function SkipLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <a
      href="#main-content"
      className={cn(
        "bg-background text-foreground focus:ring-ring fixed top-3 left-3 z-[100] -translate-y-20 border px-4 py-2 text-sm font-medium focus:translate-y-0 focus:ring-2 focus:outline-none",
        className,
      )}
    >
      {label}
    </a>
  );
}
