"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl } from "@/lib/avatar";

export interface UserAvatarCellProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  showInfo?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function UserAvatarCell({
  name,
  email,
  image,
  size = "md",
  showInfo = true,
  className = "",
}: UserAvatarCellProps) {
  const avatarUrl = getUserAvatarUrl(image, email, name);
  const initials = name?.slice(0, 1).toUpperCase() || "?";

  if (!showInfo) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={avatarUrl} alt={name || "User"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl} alt={name || "User"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{name || email || "N/A"}</div>
        {email && (
          <div className="text-muted-foreground truncate text-sm">{email}</div>
        )}
      </div>
    </div>
  );
}
