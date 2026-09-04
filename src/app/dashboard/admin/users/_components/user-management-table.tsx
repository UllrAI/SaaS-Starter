"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useDeploymentSkewGuard } from "@/hooks/use-deployment-skew";
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
} from "@/lib/actions/admin/users";
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
      return <>{t("common_user")}</>;
    case "admin":
      return <>{t("common_admin")}</>;
    case "super_admin":
      return <>{t("common_super_admin")}</>;
    default:
      return null;
  }
}
function EmailStatusLabel({ verified }: { verified: boolean | null }) {
  const { t } = useTranslation();
  return verified ? (
    <>{t("admin_user_email_verified")}</>
  ) : (
    <>{t("admin_user_email_unverified")}</>
  );
}
function AccessStatusLabel({ banned }: { banned: boolean }) {
  const { t } = useTranslation();
  return banned ? (
    <>{t("admin_user_access_disabled")}</>
  ) : (
    <>{t("admin_user_access_active")}</>
  );
}
export function UserManagementTable({
  initialData,
  initialPagination,
}: UserManagementTableProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPending, startTransition] = useTransition();
  const guardSkew = useDeploymentSkewGuard();
  const [editingUser, setEditingUser] = useState<UserWithSubscription | null>(
    null,
  );

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
      const result = await guardSkew(() =>
        updateUserAction({
          id: editingUser.id,
          name: editingUser.name || undefined,
          role: editingUser.role as UserRole,
        }),
      );
      if (!result) return;
      if (result.data) {
        toast.success(t("admin_user_update_success"));
        setEditingUser(null);
        refresh();
      } else if (result.serverError || result.validationErrors) {
        toast.error(t("admin_user_update_error"));
      }
    });
  };
  const handleSetUserDisabled = async (disabled: boolean) => {
    if (!editingUser) return;
    startTransition(async () => {
      const result = await guardSkew(() =>
        setUserDisabledAction({
          id: editingUser.id,
          disabled,
        }),
      );
      if (!result) return;
      if (result.data) {
        toast.success(
          result.data.disabled ? (
            <>{t("admin_user_disable_success")}</>
          ) : (
            <>{t("admin_user_enable_success")}</>
          ),
        );
        setEditingUser(null);
        refresh();
      } else if (result.serverError || result.validationErrors) {
        toast.error(t("admin_user_access_update_error"));
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
      label: <>{t("admin_user")}</>,
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
      label: <>{t("admin_role")}</>,
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
      label: <>{t("admin_email_status")}</>,
      render: (user) => (
        <Badge variant={user.emailVerified ? "outline" : "default"}>
          <EmailStatusLabel verified={user.emailVerified} />
        </Badge>
      ),
    },
    {
      key: "access",
      label: <>{t("admin_access")}</>,
      render: (user) => (
        <Badge variant={user.banned ? "destructive" : "outline"}>
          <AccessStatusLabel banned={user.banned} />
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: <>{t("admin_joined")}</>,
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      label: <>{t("admin_actions")}</>,
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
      label: <>{t("admin_all_roles")}</>,
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
        filterPlaceholder={<>{t("admin_filter_role")}</>}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchPlaceholder={<>{t("admin_search_users_name_email")}</>}
        emptyMessage={<>{t("admin_no_users_found")}</>}
      />
      <Dialog
        open={!!editingUser}
        onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin_edit_user")}</DialogTitle>
            <DialogDescription>
              {t("admin_modify_user_details_role_access_status")}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t("admin_name")}
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
                  {t("admin_role")}
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
                  <SelectContent position="popper">
                    {userRoleEnum.enumValues.map((role) => (
                      <SelectItem key={role} value={role}>
                        <RoleLabel role={role as UserRole} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t("admin_access")}</Label>
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
                  <>{t("admin_enable_user")}</>
                ) : (
                  <>{t("admin_disable_user")}</>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={isPending}
            >
              {t("admin_cancel")}
            </Button>
            <Button onClick={handleUpdateUser} disabled={isPending}>
              {t.rich("admin_save_changes", {
                expression0: () =>
                  isPending && (
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
