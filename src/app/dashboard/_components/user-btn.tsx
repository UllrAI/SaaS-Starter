"use client";
import { ChevronsUpDown, Loader2, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

export function UserButton() {
  const { isMobile, open } = useSidebar();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("You have been logged out successfully.");
    } catch {
      toast.info("Something went wrong. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={`flex items-center gap-2 p-2 ${!open ? "justify-center" : ""}`}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            {open && (
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size={open ? "lg" : "default"}
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${
                !open ? "h-8 w-8 justify-center p-0" : ""
              }`}
            >
              <Avatar
                className={`rounded-full ${open ? "h-8 w-8" : "h-6 w-6"}`}
              >
                <AvatarImage
                  src={getUserAvatarUrl(
                    session?.user?.image,
                    session?.user?.email,
                    session?.user?.name,
                  )}
                  alt={session?.user?.name}
                />
                <AvatarFallback className="rounded-lg">
                  {session?.user?.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {open && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={getUserAvatarUrl(
                      session?.user?.image,
                      session?.user?.email,
                      session?.user?.name,
                    )}
                    alt={session?.user?.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session?.user?.name}
                  </span>
                  <span className="truncate text-xs">
                    {session?.user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/settings?page=account">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              {loggingOut ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Log Out</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogOut className="size-4" />
                  Log Out
                </div>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
