import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/permissions";
import { createMetadata } from "@/lib/metadata";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const metadata = createMetadata({
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
});

export default async function AppLayout({ children }: DashboardLayoutProps) {
  await requireAuth();

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen =
    sidebarCookie === undefined ? true : sidebarCookie === "true";

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <Suspense fallback={<div className="bg-sidebar w-14" />}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
