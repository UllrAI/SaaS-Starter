"use client";

import * as React from "react";
import {
  Home,
  Settings,
  Upload,
  Shield,
  Users,
  CreditCard,
  BarChart3,
  LucideIcon,
  Database,
  Sparkles,
  Image,
} from "lucide-react";
import { APP_NAME } from "@/lib/config/constants";
import { isAdminRole, UserRole } from "@/lib/config/roles";
import { enabledTablesMap } from "@/lib/config/admin-tables";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { UserButton } from "./user-btn";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

const navigation: {
  title: string;
  url: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "AI Studio",
    url: "/ai-studio",
    icon: Sparkles,
  },
  {
    title: "My Artworks",
    url: "/artworks",
    icon: Image,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const adminNavigation: {
  title: string;
  url: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Admin Dashboard",
    url: "/dashboard/admin",
    icon: BarChart3,
  },
  {
    title: "User Management",
    url: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Payments",
    url: "/dashboard/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Subscriptions",
    url: "/dashboard/admin/subscriptions",
    icon: Shield,
  },
  {
    title: "Uploads Managements",
    url: "/dashboard/admin/uploads",
    icon: Upload,
  },
];

const genericTableNavigation = Object.keys(enabledTablesMap).map((key) => ({
  title: key.charAt(0).toUpperCase() + key.slice(1),
  url: `/dashboard/admin/tables/${key}`,
  icon: Database,
}));

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, toggleSidebar } = useSidebar();
  const { data: session } = useSession();

  const isAdmin =
    session?.user &&
    isAdminRole((session.user as { role?: UserRole }).role || "user");

  const handleNavigation = (url: string) => () => {
    router.replace(url);
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          "flex flex-row items-center py-3 text-sm font-semibold",
          open ? "px-4" : "justify-center",
        )}
      >
        <Link href="/">
          <Logo className="m-0 size-5 p-1" />
        </Link>
        {open && (
          <>
            <span className="text-base font-semibold">{APP_NAME}</span>
          </>
        )}
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <div
                    onClick={handleNavigation(item.url)}
                    onDoubleClick={() => {
                      handleNavigation(item.url)();
                      toggleSidebar();
                    }}
                  >
                    <SidebarMenuButton
                      isActive={item.url === pathname}
                      tooltip={item.title}
                      className="cursor-pointer"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupContent className="flex flex-col gap-2">
                {open && (
                  <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
                    Admin
                  </div>
                )}
                <SidebarMenu>
                  {adminNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <div
                        onClick={handleNavigation(item.url)}
                        onDoubleClick={() => {
                          handleNavigation(item.url)();
                          toggleSidebar();
                        }}
                      >
                        <SidebarMenuButton
                          isActive={item.url === pathname}
                          tooltip={item.title}
                          className="cursor-pointer"
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 新增：通用表格管理菜单 */}
            {genericTableNavigation.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent className="flex flex-col gap-2">
                  {open && (
                    <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
                      Manage Tables
                    </div>
                  )}
                  <SidebarMenu>
                    {genericTableNavigation.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <div
                          onClick={handleNavigation(item.url)}
                          onDoubleClick={() => {
                            handleNavigation(item.url)();
                            toggleSidebar();
                          }}
                        >
                          <SidebarMenuButton
                            isActive={pathname.startsWith(item.url)}
                            tooltip={item.title}
                            className="cursor-pointer"
                          >
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="border-sidebar-divider border-t p-2">
        <UserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
