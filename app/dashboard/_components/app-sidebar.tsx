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
import { handleActivationKey } from "@/lib/utils/accessibility";

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
    title: "Upload",
    url: "/dashboard/upload",
    icon: Upload,
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

// Custom navigation item component with proper accessibility
function NavigationItem({
  item,
  isActive,
  onClick,
  onDoubleClick,
}: {
  item: { title: string; url: string; icon: LucideIcon };
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      handleActivationKey(e, onClick);
    },
    [onClick],
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer"
        aria-label={`Navigate to ${item.title}`}
      >
        <item.icon className="size-4" aria-hidden="true" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, toggleSidebar } = useSidebar();
  const { data: session } = useSession();

  const isAdmin =
    session?.user &&
    isAdminRole((session.user as { role?: UserRole }).role || "user");

  const handleNavigation = React.useCallback(
    (url: string) => () => {
      router.replace(url);
    },
    [router],
  );

  const handleNavigationWithToggle = React.useCallback(
    (url: string) => () => {
      router.replace(url);
      toggleSidebar();
    },
    [router, toggleSidebar],
  );

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      <SidebarHeader
        className={cn(
          "flex flex-row items-center py-3 text-sm font-semibold",
          open ? "px-4" : "justify-center",
        )}
      >
        <Link
          href="/"
          className="focus:ring-primary rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
          aria-label={`Go to ${APP_NAME} homepage`}
        >
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
            <SidebarMenu role="navigation" aria-label="Main navigation">
              {navigation.map((item) => (
                <NavigationItem
                  key={item.title}
                  item={item}
                  isActive={item.url === pathname}
                  onClick={handleNavigation(item.url)}
                  onDoubleClick={handleNavigationWithToggle(item.url)}
                />
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
                  <div
                    className="text-muted-foreground px-2 py-1 text-xs font-semibold"
                    role="heading"
                    aria-level={3}
                  >
                    Admin
                  </div>
                )}
                <SidebarMenu role="navigation" aria-label="Admin navigation">
                  {adminNavigation.map((item) => (
                    <NavigationItem
                      key={item.title}
                      item={item}
                      isActive={item.url === pathname}
                      onClick={handleNavigation(item.url)}
                      onDoubleClick={handleNavigationWithToggle(item.url)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 新增：通用表格管理菜单 */}
            {genericTableNavigation.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent className="flex flex-col gap-2">
                  {open && (
                    <div
                      className="text-muted-foreground px-2 py-1 text-xs font-semibold"
                      role="heading"
                      aria-level={3}
                    >
                      Manage Tables
                    </div>
                  )}
                  <SidebarMenu
                    role="navigation"
                    aria-label="Table management navigation"
                  >
                    {genericTableNavigation.map((item) => (
                      <NavigationItem
                        key={item.title}
                        item={item}
                        isActive={pathname.startsWith(item.url)}
                        onClick={handleNavigation(item.url)}
                        onDoubleClick={handleNavigationWithToggle(item.url)}
                      />
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
