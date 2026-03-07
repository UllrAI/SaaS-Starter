"use client";
import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Home,
  LucideIcon,
  Settings,
  Shield,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
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
import { UserButton } from "./user-btn";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";

type NavigationItem = {
  id: string;
  label: React.ReactNode;
  url: string;
  icon: LucideIcon;
  matchMode?: "exact" | "prefix";
};

const navigation: NavigationItem[] = [
  {
    id: "home",
    label: <>Home</>,
    url: "/dashboard",
    icon: Home,
    matchMode: "exact",
  },
  {
    id: "upload",
    label: <>Upload</>,
    url: "/dashboard/upload",
    icon: Upload,
    matchMode: "exact",
  },
  {
    id: "billing",
    label: <>Billing</>,
    url: "/dashboard/billing",
    icon: Wallet,
    matchMode: "exact",
  },
  {
    id: "settings",
    label: <>Settings</>,
    url: "/dashboard/settings",
    icon: Settings,
    matchMode: "exact",
  },
];

const adminNavigation: NavigationItem[] = [
  {
    id: "admin-dashboard",
    label: <>Admin Dashboard</>,
    url: "/dashboard/admin",
    icon: BarChart3,
    matchMode: "exact",
  },
  {
    id: "user-management",
    label: <>User Management</>,
    url: "/dashboard/admin/users",
    icon: Users,
    matchMode: "exact",
  },
  {
    id: "payments",
    label: <>Payments</>,
    url: "/dashboard/admin/payments",
    icon: CreditCard,
    matchMode: "exact",
  },
  {
    id: "subscriptions",
    label: <>Subscriptions</>,
    url: "/dashboard/admin/subscriptions",
    icon: Shield,
    matchMode: "exact",
  },
  {
    id: "uploads-management",
    label: <>Uploads Management</>,
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
  const itemMatchMode = item.matchMode || "exact";
  const label = item.label;

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

  const maxMatchLength = Math.max(...matchingItems.map((navItem) => navItem.url.length));
  const isActive = isMatch && item.url.length === maxMatchLength;

  return (
    <SidebarMenuButton asChild isActive={isActive} tooltip={{ children: label }}>
      <Link href={item.url}>
        <item.icon className="size-4" />
        <span>{label}</span>
      </Link>
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
              <SidebarMenuLink item={item} pathname={pathname} allItems={items} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          "flex flex-row items-center py-3 text-sm font-semibold",
          open ? "px-4" : "justify-center",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <Logo className="m-0 size-5 p-1" />
          {open && <span className="text-base font-semibold">{APP_NAME}</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection title={undefined} items={navigation} pathname={pathname} />

        {showAdminSections && (
          <SidebarSection
            title={open ? <>Admin</> : undefined}
            items={adminNavigation}
            pathname={pathname}
          />
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
