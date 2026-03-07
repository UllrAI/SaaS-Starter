import type { ReactNode } from "react";
import { DashboardPageHeader } from "./dashboard-page-header";

interface DashboardPageWrapperProps {
  title: ReactNode;
  parentTitle?: ReactNode;
  parentUrl?: string;
  description?: ReactNode;
  actions?: ReactNode;
  showSidebarTrigger?: boolean;
  children: ReactNode;
}

export function DashboardPageWrapper({
  title,
  parentTitle,
  parentUrl,
  description,
  actions,
  showSidebarTrigger = true,
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
      <main className="flex-1 space-y-6 px-4 py-2">{children}</main>
    </>
  );
}
