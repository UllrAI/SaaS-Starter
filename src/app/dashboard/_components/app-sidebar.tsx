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
} from "lucide-react";
import { APP_NAME } from "@/lib/config/constants";
import { isAdminRole } from "@/lib/config/roles";

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
import { useSession } from "@/lib/auth/client";

const SidebarLabelHome = () => <>Home</>;
const SidebarLabelUpload = () => <>Upload</>;
const SidebarLabelSettings = () => <>Settings</>;
const SidebarLabelAdminDashboard = () => <>Admin Dashboard</>;
const SidebarLabelUserManagement = () => <>User Management</>;
const SidebarLabelPayments = () => <>Payments</>;
const SidebarLabelSubscriptions = () => <>Subscriptions</>;
const SidebarLabelUploadsManagement = () => <>Uploads Management</>;
const SidebarLabelAdmin = () => <>Admin</>;

type NavigationItem = {
  id: string;
  Label: React.ComponentType;
  url: string;
  icon: LucideIcon;
  matchMode?: "exact" | "prefix";
};

const navigation: NavigationItem[] = [
  {
    id: "home",
    Label: SidebarLabelHome,
    url: "/dashboard",
    icon: Home,
    matchMode: "exact",
  },
  {
    id: "upload",
    Label: SidebarLabelUpload,
    url: "/dashboard/upload",
    icon: Upload,
    matchMode: "exact",
  },
  {
    id: "settings",
    Label: SidebarLabelSettings,
    url: "/dashboard/settings",
    icon: Settings,
    matchMode: "prefix",
  },
];

const adminNavigation: NavigationItem[] = [
  {
    id: "admin-dashboard",
    Label: SidebarLabelAdminDashboard,
    url: "/dashboard/admin",
    icon: BarChart3,
    matchMode: "exact",
  },
  {
    id: "user-management",
    Label: SidebarLabelUserManagement,
    url: "/dashboard/admin/users",
    icon: Users,
    matchMode: "exact",
  },
  {
    id: "payments",
    Label: SidebarLabelPayments,
    url: "/dashboard/admin/payments",
    icon: CreditCard,
    matchMode: "exact",
  },
  {
    id: "subscriptions",
    Label: SidebarLabelSubscriptions,
    url: "/dashboard/admin/subscriptions",
    icon: Shield,
    matchMode: "exact",
  },
  {
    id: "uploads-management",
    Label: SidebarLabelUploadsManagement,
    url: "/dashboard/admin/uploads",
    icon: Upload,
    matchMode: "exact",
  },
];

interface MenuItemProps {
  item: NavigationItem;
  pathname: string;
  allItems: NavigationItem[];
}

function SidebarMenuLink({ item, pathname, allItems }: MenuItemProps) {
  const router = useRouter();
  const itemMatchMode = item.matchMode || "exact";
  const Label = item.Label;
  const label = <Label />;

  const isMatch =
    itemMatchMode === "exact"
      ? pathname === item.url
      : pathname.startsWith(item.url);

  const matchingItems = allItems.filter((otherItem) => {
    const otherMode = otherItem.matchMode || "exact";
    return otherMode === "exact"
      ? pathname === otherItem.url
      : pathname.startsWith(otherItem.url);
  });

  const maxMatchLength = Math.max(...matchingItems.map((i) => i.url.length));

  const isActive = isMatch && item.url.length === maxMatchLength;

  const handleClick = () => {
    router.push(item.url);
  };

  return (
    <SidebarMenuButton
      isActive={isActive}
      tooltip={{ children: label }}
      className="w-full cursor-pointer"
      onClick={handleClick}
    >
      <item.icon className="size-4" />
      <span>{label}</span>
    </SidebarMenuButton>
  );
}

interface MenuSectionProps {
  title?: React.ReactNode;
  items: MenuItemProps["item"][];
  pathname: string;
}

function SidebarSection({ title, items, pathname }: MenuSectionProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {title && (
          <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
            {title}
          </div>
        )}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuLink
                item={item}
                pathname={pathname}
                allItems={items}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const { data: session } = useSession();

  const getUserRole = () =>
    (session?.user?.role as "user" | "admin" | "super_admin") || "user";

  const showAdminSections = isAdminRole(getUserRole());

  const getNormalizedUser = () => {
    if (!session?.user) return null;
    return {
      ...session.user,
      role: getUserRole(),
      image: session.user.image || undefined,
    };
  };

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          "flex flex-row items-center py-3 text-sm font-semibold",
          open ? "px-4" : "justify-center",
        )}
      >
        <button onClick={handleLogoClick} className="cursor-pointer">
          <Logo className="m-0 size-5 p-1" />
        </button>
        {open && <span className="text-base font-semibold">{APP_NAME}</span>}
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarSection
          title={undefined}
          items={navigation}
          pathname={pathname}
        />

        {showAdminSections && (
          <>
            <SidebarSection
              title={open ? <SidebarLabelAdmin /> : undefined}
              items={adminNavigation}
              pathname={pathname}
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="border-sidebar-divider border-t p-2">
        <UserButton user={getNormalizedUser()} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
