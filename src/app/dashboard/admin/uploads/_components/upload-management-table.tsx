"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useDeploymentSkewGuard } from "@/hooks/use-deployment-skew";
import { useState, ReactNode, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { UserAvatarCell } from "@/components/admin/user-avatar-cell";
import { formatFileSize } from "@/lib/config/upload";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
  getUploads,
  deleteUploadAction,
  batchDeleteUploadsAction,
} from "@/lib/actions/admin/uploads";
import Image from "next/image";
import { useIntlLocale } from "@/hooks/use-intl-locale";
interface Upload {
  id: string;
  userId: string;
  fileKey: string;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
}
interface UploadManagementTableProps {
  initialData: Upload[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export function UploadManagementTable({
  initialData,
  initialPagination,
}: UploadManagementTableProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPending, startTransition] = useTransition();
  const guardSkew = useDeploymentSkewGuard();
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<Upload | null>(null);
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(
    new Set(),
  );
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] =
    useState(false);
  const queryUploads = useCallback(
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
      getUploads({
        page,
        limit,
        search,
        fileType: filter,
      }),
    [],
  );
  const {
    data: uploads,
    loading,
    error,
    pagination,
    searchTerm,
    filter: fileTypeFilter,
    setSearchTerm: handleSearch,
    setFilter: handleFileTypeFilter,
    setCurrentPage,
    refresh,
  } = useAdminTable<Upload>({
    queryAction: queryUploads,
    initialData,
    initialPagination,
  });
  const confirmDeleteUpload = async () => {
    if (!uploadToDelete) return;
    startTransition(async () => {
      const result = await guardSkew(
        () =>
          deleteUploadAction({
            uploadId: uploadToDelete.id,
          }),
        () => setUploadToDelete(null),
      );
      if (!result) return;
      if (result.data) {
        toast.success(t("upload_delete_success"));
        setUploadToDelete(null);
        refresh();
      } else if (result.serverError) {
        toast.error(t("upload_delete_error"));
      }
    });
  };
  const handleBatchDelete = async () => {
    if (selectedUploads.size === 0) return;
    startTransition(async () => {
      const result = await guardSkew(
        () =>
          batchDeleteUploadsAction({
            uploadIds: Array.from(selectedUploads),
          }),
        () => setIsBatchDeleteConfirmOpen(false),
      );
      if (!result) return;
      if (result.data) {
        toast.success(t("upload_batch_delete_success"));
        setSelectedUploads(new Set());
        setIsBatchDeleteConfirmOpen(false);
        refresh();
      } else if (result.serverError) {
        toast.error(t("upload_batch_delete_error"));
      }
    });
  };
  const handleSelectUpload = (uploadId: string, checked: boolean) => {
    setSelectedUploads((prev) => {
      const newSelected = new Set(prev);
      if (checked) newSelected.add(uploadId);
      else newSelected.delete(uploadId);
      return newSelected;
    });
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUploads(new Set(uploads.map((u) => u.id)));
    else setSelectedUploads(new Set());
  };
  const isAllSelected =
    uploads.length > 0 && selectedUploads.size === uploads.length;
  const isPartiallySelected =
    selectedUploads.size > 0 && selectedUploads.size < uploads.length;
  const columns: Array<{
    key: string;
    label: ReactNode;
    render: (item: Upload) => ReactNode;
  }> = [
    {
      key: "select",
      label: (
        <Checkbox
          checked={isAllSelected || (isPartiallySelected && "indeterminate")}
          onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
        />
      ),
      render: (upload) => (
        <Checkbox
          checked={selectedUploads.has(upload.id)}
          onCheckedChange={(checked) =>
            handleSelectUpload(upload.id, Boolean(checked))
          }
        />
      ),
    },
    {
      key: "user",
      label: <>{t("admin_user")}</>,
      render: (upload) => (
        <UserAvatarCell
          name={upload.user.name}
          email={upload.user.email}
          image={upload.user.image}
        />
      ),
    },
    {
      key: "fileName",
      label: <>{t("admin_file")}</>,
      render: (upload) => (
        <div>
          <p className="max-w-xs truncate font-medium">{upload.fileName}</p>
          <p className="text-muted-foreground text-xs">
            {formatFileSize(upload.fileSize)}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: <>{t("admin_uploaded")}</>,
      render: (upload) => (
        <p className="text-sm">
          {new Date(upload.createdAt).toLocaleDateString(intlLocale)}
        </p>
      ),
    },
    {
      key: "actions",
      label: <>{t("admin_actions")}</>,
      render: (upload) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("upload_action_view", {
              fileName: upload.fileName,
            })}
            onClick={() => {
              setSelectedUpload(upload);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href={upload.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("upload_action_open", {
                fileName: upload.fileName,
              })}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("upload_action_delete", {
              fileName: upload.fileName,
            })}
            onClick={() => setUploadToDelete(upload)}
            disabled={isPending}
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  const filterOptions = [
    {
      value: "all",
      label: <>{t("admin_all_types")}</>,
    },
    {
      value: "image",
      label: <>{t("admin_images")}</>,
    },
    {
      value: "video",
      label: <>{t("admin_videos")}</>,
    },
    {
      value: "audio",
      label: <>{t("admin_audio")}</>,
    },
    {
      value: "pdf",
      label: <>{t("admin_pdf")}</>,
    },
    {
      value: "text",
      label: <>{t("admin_text")}</>,
    },
    {
      value: "archive",
      label: <>{t("admin_archives")}</>,
    },
    {
      value: "other",
      label: <>{t("admin_other")}</>,
    },
  ];
  return (
    <>
      {selectedUploads.size > 0 && (
        <div className="bg-muted/50 mb-4 flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">
            {t("admin_selected", {
              expression0: selectedUploads.size,
            })}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsBatchDeleteConfirmOpen(true)}
            disabled={isPending}
          >
            {t.rich("admin_delete_selected", {
              expression0: () =>
                isPending && selectedUploads.size > 1 ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                ),
            })}
          </Button>
        </div>
      )}
      <AdminTableBase<Upload>
        data={uploads}
        columns={columns}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        filterValue={fileTypeFilter}
        onFilterChange={handleFileTypeFilter}
        filterOptions={filterOptions}
        filterPlaceholder={<>{t("admin_filter_type")}</>}
        pagination={pagination}
        onPageChange={setCurrentPage}
        searchPlaceholder={<>{t("admin_search_filename_user_email")}</>}
        emptyMessage={<>{t("admin_no_uploads_found")}</>}
      />

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin_upload_details")}</DialogTitle>
          </DialogHeader>
          {selectedUpload && (
            <div className="space-y-4 py-4">
              {selectedUpload.contentType.startsWith("image/") && (
                <Image
                  src={selectedUpload.url}
                  alt={selectedUpload.fileName}
                  width={400}
                  height={300}
                  className="max-h-64 w-full rounded-md object-contain"
                />
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Label>{t("admin_file_name_upload")}</Label>
                <p className="truncate text-sm">{selectedUpload.fileName}</p>
                <Label>{t("admin_size")}</Label>
                <p className="text-sm">
                  {formatFileSize(selectedUpload.fileSize)}
                </p>
                <Label>{t("admin_user")}</Label>
                <p className="truncate text-sm">{selectedUpload.user.email}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={!!uploadToDelete}
        onOpenChange={(isOpen) => !isOpen && setUploadToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin_confirm_deletion")}</DialogTitle>
            <DialogDescription>
              {t("admin_you_sure_want_delete_file_action")}
            </DialogDescription>
            <div className="bg-muted mt-2 rounded border p-2">
              <p className="text-muted-foreground mb-1 text-sm">
                {t("admin_file_name")}
              </p>
              <p className="text-sm font-medium break-all">
                {uploadToDelete?.fileName}
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadToDelete(null)}
              disabled={isPending}
            >
              {t("admin_cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUpload}
              disabled={isPending}
            >
              {t.rich("admin_delete", {
                expression0: () =>
                  isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ),
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog
        open={isBatchDeleteConfirmOpen}
        onOpenChange={setIsBatchDeleteConfirmOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin_confirm_batch_deletion")}</DialogTitle>
            <DialogDescription>
              {t("admin_you_sure_want_delete_selected_file", {
                expression0: selectedUploads.size,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBatchDeleteConfirmOpen(false)}
              disabled={isPending}
            >
              {t("admin_cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={isPending}
            >
              {t.rich("admin_delete", {
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
