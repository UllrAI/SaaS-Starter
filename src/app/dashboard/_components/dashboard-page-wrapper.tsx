import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "./dashboard-page-header";

interface DashboardPageWrapperProps {
  title: ReactNode;
  parentTitle?: ReactNode;
  parentUrl?: string;
  description?: ReactNode;
  actions?: ReactNode;
  showSidebarTrigger?: boolean;
  headerClassName?: string;
  mainClassName?: string;
  children: ReactNode;
}

export function DashboardPageWrapper({
  title,
  parentTitle,
  parentUrl,
  description,
  actions,
  showSidebarTrigger = true,
  headerClassName,
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
        className={headerClassName}
      />
      <main className={cn("flex-1 space-y-6 px-4 py-2", mainClassName)}>
        {children}
      </main>
    </>
  );
}
