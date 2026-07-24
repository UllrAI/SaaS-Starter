import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/permissions";
import { AppProviders } from "@/components/app-providers";
import {
  AppDocument,
  createRootMetadata,
} from "@/components/layout/app-document";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = await createRootMetadata(locale);
  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function AppLayout({ children }: DashboardLayoutProps) {
  await requireAuth();

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen =
    sidebarCookie === undefined ? true : sidebarCookie === "true";
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);

  return (
    <AppDocument locale={locale} messages={messages}>
      <AppProviders>
        <SidebarProvider defaultOpen={defaultSidebarOpen}>
          <Suspense fallback={<div className="bg-sidebar w-14" />}>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="flex flex-col">{children}</SidebarInset>
        </SidebarProvider>
      </AppProviders>
    </AppDocument>
  );
}
