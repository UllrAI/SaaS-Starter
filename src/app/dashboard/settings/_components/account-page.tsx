"use client";

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
import { Session } from "@/types/auth";
import { Edit, Loader2 } from "lucide-react";

// Props are no longer needed for active sessions
export function AccountPage() {
  const { data: currentUserSession, isPending } = useSession();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
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
                  alt={currentUserSession?.user.name || "User Avatar"}
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

// EditUserDialog component remains unchanged, as its functionality is separate.
function EditUserDialog({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
  const [name, setName] = useState<string>(session?.user.name || "");
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <Edit size={16} />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Change your name and profile picture
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={session?.user.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>Profile Picture</Label>
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
                    alt={name || "User Avatar"}
                  />
                  <AvatarFallback>{name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  Profile pictures are automatically generated using DiceBear
                  avatars based on your email address.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              await authClient.updateUser({
                name: name !== session?.user.name ? name : undefined,
                fetchOptions: {
                  onSuccess: () => {
                    toast.success("Profile updated successfully");
                    setOpen(false);
                    router.refresh();
                  },
                  onError: (error) => {
                    toast.error(error.error.message);
                  },
                },
              });
              setIsLoading(false);
            }}
          >
            {isLoading ? (
              <Loader2 size={15} className="mr-2 animate-spin" />
            ) : null}
            Update Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
