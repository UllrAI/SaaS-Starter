import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { SessionGuard } from "./_components/session-guard";
import { cookies } from "next/headers";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen =
    sidebarCookie === undefined ? true : sidebarCookie === "true";

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <SessionGuard>{children}</SessionGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
