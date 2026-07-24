"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl } from "@/lib/avatar";
import { useTranslation } from "@/lib/i18n/translation/client";

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
  const { t } = useTranslation();
  const avatarUrl = getUserAvatarUrl(image, email, name);
  const initials = name?.slice(0, 1).toUpperCase() || "?";
  const avatarAlt = name
    ? t("user_avatar_named_alt", "Profile image for {name}", { name })
    : t("user_avatar_alt", "User profile image");

  if (!showInfo) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={avatarUrl} alt={avatarAlt} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl} alt={avatarAlt} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">
          {name || email || t("common_not_available", "Not available")}
        </div>
        {email && (
          <div className="text-muted-foreground truncate text-sm">{email}</div>
        )}
      </div>
    </div>
  );
}
