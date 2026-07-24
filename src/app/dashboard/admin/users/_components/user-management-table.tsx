"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useState, ReactNode, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import { userRoleEnum } from "@/database/schema";
import type { UserRole } from "@/lib/config/roles";
import { useAdminTable } from "@/hooks/use-admin-table";
import type { UserWithSubscription } from "@/types/billing";
import {
  getUsers,
  setUserDisabledAction,
  updateUserAction,
} from "@/lib/actions/admin";
import { useIntlLocale } from "@/hooks/use-intl-locale";
interface UserManagementTableProps {
  initialData: UserWithSubscription[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
function RoleLabel({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  switch (role) {
    case "user":
      return <>{t("6ccd40cf07d2", "User")}</>;
    case "admin":
      return <>{t("8881841729d7", "Admin")}</>;
    case "super_admin":
      return <>{t("9d7302206bac", "Super Admin")}</>;
    default:
      return null;
  }
}
function EmailStatusLabel({ verified }: { verified: boolean | null }) {
  return verified ? <>Verified</> : <>Unverified</>;
}
function AccessStatusLabel({ banned }: { banned: boolean }) {
  return banned ? <>Disabled</> : <>Active</>;
}
export function UserManagementTable({
  initialData,
  initialPagination,
}: UserManagementTableProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<UserWithSubscription | null>(
    null,
  );

  // FIX: Wrap queryAction with useCallback to stabilize its reference
  const queryUsers = useCallback(
    async ({
      page,
      limit,
      search,
      filter,
    }: {
      page: number;
      limit: number;
      search?: string;
      filter?: string;
    }) =>
      getUsers({
        page,
        limit,
        search,
        role: filter as UserRole | "all",
      }),
    [],
  );
  const {
    data: users,
    loading,
    error,
    pagination,
    searchTerm,
    filter: roleFilter,
    setSearchTerm: handleSearch,
    setFilter: handleRoleFilter,
    setCurrentPage: handlePageChange,
    refresh,
  } = useAdminTable<UserWithSubscription>({
    queryAction: queryUsers,
    initialData,
    initialPagination,
    initialFilter: "all",
  });
  const handleEditUser = (user: UserWithSubscription) => {
    setEditingUser({
      ...user,
    });
  };
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    startTransition(async () => {
      const result = await updateUserAction({
        id: editingUser.id,
        name: editingUser.name || undefined,
        role: editingUser.role as UserRole,
      });
      if (result.data) {
        toast.success(result.data.message);
        setEditingUser(null);
        refresh();
      } else if (result.serverError || result.validationErrors) {
        toast.error(result.serverError || <>Validation failed.</>);
      }
    });
  };
  const handleSetUserDisabled = async (disabled: boolean) => {
    if (!editingUser) return;
    startTransition(async () => {
      const result = await setUserDisabledAction({
        id: editingUser.id,
        disabled,
      });
      if (result.data) {
        toast.success(
          result.data.disabled ? (
            <>User disabled and signed out successfully.</>
          ) : (
            <>User re-enabled successfully.</>
          ),
        );
        setEditingUser(null);
        refresh();
      } else if (result.serverError || result.validationErrors) {
        toast.error(result.serverError || <>Validation failed.</>);
      }
    });
  };
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString(intlLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const columns: Array<{
    key: keyof UserWithSubscription | string;
    label: ReactNode;
    render?: (item: UserWithSubscription) => ReactNode;
  }> = [
    {
      key: "user",
      label: <>{t("b13c2002ce98", "User")}</>,
      render: (user) => (
        <UserAvatarCell
          name={user.name}
          email={user.email}
          image={user.image}
        />
      ),
    },
    {
      key: "role",
      label: <>{t("7c471349e453", "Role")}</>,
      render: (user) => (
        <Badge
          className="capitalize"
          variant={
            user.role === "admin" || user.role === "super_admin"
              ? "default"
              : "outline"
          }
        >
          <RoleLabel role={user.role as UserRole} />
        </Badge>
      ),
    },
    {
      key: "emailStatus",
      label: <>{t("d2d35a96df12", "Email Status")}</>,
      render: (user) => (
        <Badge variant={user.emailVerified ? "outline" : "default"}>
          <EmailStatusLabel verified={user.emailVerified} />
        </Badge>
      ),
    },
    {
      key: "access",
      label: <>{t("150cb0cd9a70", "Access")}</>,
      render: (user) => (
        <Badge variant={user.banned ? "destructive" : "outline"}>
          <AccessStatusLabel banned={user.banned} />
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: <>{t("a90ad802d086", "Joined")}</>,
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      label: <>{t("f97a37a5f4b9", "Actions")}</>,
      render: (user) => (
        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  const roleFilterOptions = [
    {
      value: "all",
      label: <>{t("6417d4cefe2a", "All Roles")}</>,
    },
    ...userRoleEnum.enumValues.map((role) => ({
      value: role,
      label: <RoleLabel role={role as UserRole} />,
    })),
  ];
  return (
    <>
      <AdminTableBase<UserWithSubscription>
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        filterValue={roleFilter}
        onFilterChange={handleRoleFilter}
        filterOptions={roleFilterOptions}
        filterPlaceholder={<>{t("e1f6bb9bc5e7", "Filter by role")}</>}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchPlaceholder={
          <>{t("b7b2eb172b0e", "Search users by name or email...")}</>
        }
        emptyMessage={<>{t("dc923d92538d", "No users found")}</>}
      />
      <Dialog
        open={!!editingUser}
        onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("3f72daf5f969", "Edit User")}</DialogTitle>
            <DialogDescription>
              {t(
                "f0f4e1a0a928",
                "Modify user details, role, and access status.",
              )}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t("21f727133895", "Name")}
                </Label>
                <Input
                  id="name"
                  value={editingUser.name ?? ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  {t("7c471349e453", "Role")}
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: UserRole) =>
                    setEditingUser({
                      ...editingUser,
                      role: value,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoleEnum.enumValues.map((role) => (
                      <SelectItem key={role} value={role}>
                        <RoleLabel role={role as UserRole} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  {t("150cb0cd9a70", "Access")}
                </Label>
                <div className="col-span-3 flex items-center gap-3">
                  <Badge
                    variant={editingUser.banned ? "destructive" : "outline"}
                  >
                    <AccessStatusLabel banned={editingUser.banned} />
                  </Badge>
                  {editingUser.banned && editingUser.banReason && (
                    <span className="text-muted-foreground text-sm">
                      {editingUser.banReason}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {editingUser && (
              <Button
                variant={editingUser.banned ? "outline" : "destructive"}
                onClick={() => handleSetUserDisabled(!editingUser.banned)}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser.banned ? (
                  <>{t("499435f34ebc", "Enable User")}</>
                ) : (
                  <>{t("db302291fb48", "Disable User")}</>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={isPending}
            >
              {t("092e223f8cee", "Cancel")}
            </Button>
            <Button onClick={handleUpdateUser} disabled={isPending}>
              {t("0e370f9af63b", "{expression0} Save Changes", {
                expression0: isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ),
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
