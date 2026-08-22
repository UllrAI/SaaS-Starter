import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "./dashboard-page-header";

interface DashboardPageWrapperProps {
  title: ReactNode;
  layout?: "content" | "workspace";
  parentTitle?: ReactNode;
  parentUrl?: string;
  description?: ReactNode;
  actions?: ReactNode;
  showSidebarTrigger?: boolean;
  mainClassName?: string;
  children: ReactNode;
}

export function DashboardPageWrapper({
  title,
  layout = "content",
  parentTitle,
  parentUrl,
  description,
  actions,
  showSidebarTrigger = true,
  mainClassName,
  children,
}: DashboardPageWrapperProps) {
  return (
    <>
      <DashboardPageHeader
        title={title}
        parentTitle={parentTitle}
        parentUrl={parentUrl}
        description={description}
        actions={actions}
        showSidebarTrigger={showSidebarTrigger}
      />
      <main
        className={cn(
          layout === "workspace"
            ? "flex h-[calc(100svh-var(--header-height))] min-h-0 flex-none overflow-hidden md:h-[calc(100svh-var(--header-height)-1rem)]"
            : "@container/main flex-1 space-y-4 px-4 py-4 md:space-y-6 md:py-6 lg:px-6",
          mainClassName,
        )}
      >
        {children}
      </main>
    </>
  );
}
