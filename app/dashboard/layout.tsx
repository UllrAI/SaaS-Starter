import { Suspense } from "react";
import Loading from "@/app/loading";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { SessionGuard } from "./_components/session-guard"; // 导入守卫组件

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <SessionGuard>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </SessionGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
