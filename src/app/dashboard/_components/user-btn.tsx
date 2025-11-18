"use client";
import { ChevronsUpDown, Loader2, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl } from "@/lib/avatar";
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
import type { AuthUser } from "@/lib/auth/permissions";

interface UserButtonProps {
  user?: AuthUser | null;
}

export function UserButton({ user }: UserButtonProps) {
  const { isMobile, open } = useSidebar();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const userInitial = user.name?.slice(0, 1).toUpperCase() || "U";
  const avatarUrl = getUserAvatarUrl(user.image, user.email, user.name);

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
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {open && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
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
                  <AvatarImage src={avatarUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
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
