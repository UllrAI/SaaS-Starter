"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserAvatarUrl } from "@/lib/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient, useSession } from "@/lib/auth/client";
import { Edit, Loader2 } from "lucide-react";

interface EditableSession {
  user: {
    email: string;
    image?: string | null;
    name: string;
  };
}

function ProfileUpdatedToast() {
  const { t } = useTranslation();
  return <>{t("settings_profile_updated_successfully")}</>;
}

function ProfileUpdateFailedToast() {
  const { t } = useTranslation();
  return <>{t("profile_update_failed")}</>;
}

export function AccountPage() {
  const { t } = useTranslation();
  const { data: currentUserSession, isPending } = useSession();
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("settings_account_information")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            {isPending ? (
              <Skeleton className="h-14 w-14 rounded-full" />
            ) : (
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={getUserAvatarUrl(
                    currentUserSession?.user.image,
                    currentUserSession?.user.email,
                    currentUserSession?.user.name,
                  )}
                  alt={currentUserSession?.user.name || t("profile_avatar_alt")}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg uppercase">
                  {currentUserSession?.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-base font-medium">
                {currentUserSession?.user.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {currentUserSession?.user.email}
              </p>
            </div>
          </div>
          <EditUserDialog session={currentUserSession} isPending={isPending} />
        </div>
      </CardContent>
    </Card>
  );
}

function EditUserDialog({
  session,
  isPending,
}: {
  session: EditableSession | null;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState<string>(session?.user.name || "");
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setName(session?.user.name || "");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <Edit size={16} />
          {t("settings_edit_profile")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("settings_edit_profile_user")}</DialogTitle>
          <DialogDescription>
            {t("settings_change_display_name")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("settings_full_name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={session?.user.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("settings_profile_picture")}</Label>
            <div className="flex items-center gap-4">
              {isPending ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={getUserAvatarUrl(
                      session?.user.image,
                      session?.user.email,
                      session?.user.name,
                    )}
                    alt={name || t("profile_avatar_alt")}
                  />
                  <AvatarFallback>{name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  {t("settings_profile_pictures_dicebear")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isLoading || isPending || !session || !name.trim()}
            onClick={async () => {
              const normalizedName = name.trim();
              if (!normalizedName) {
                toast.error(t("profile_name_required"));
                return;
              }
              setIsLoading(true);
              try {
                await authClient.updateUser({
                  name:
                    normalizedName !== session?.user.name
                      ? normalizedName
                      : undefined,
                  fetchOptions: {
                    onSuccess: () => {
                      toast.success(<ProfileUpdatedToast />);
                      setOpen(false);
                      router.refresh();
                    },
                    onError: () => {
                      toast.error(<ProfileUpdateFailedToast />);
                    },
                  },
                });
              } catch {
                toast.error(<ProfileUpdateFailedToast />);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {t.rich("settings_update_profile", {
              expression0: () =>
                isLoading ? (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                ) : null,
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
