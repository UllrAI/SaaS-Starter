import { Suspense } from "react";
import Loading from "@/app/loading";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { SessionGuard } from "./_components/session-guard"; // 导入守卫组件

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Skip link component for accessibility
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="focus:bg-primary focus:text-primary-foreground focus:ring-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

export default async function AppLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <SkipLink />
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <SessionGuard>
          <main id="main-content" role="main" className="flex-1">
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </main>
        </SessionGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
