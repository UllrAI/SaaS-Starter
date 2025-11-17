"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
  getGenericTableData,
  createRecord,
  updateRecord,
  deleteRecords,
} from "@/lib/actions/admin-generic";
import type { EnabledTableKeys } from "@/lib/config/admin-tables";
import type { SchemaInfo } from "@/lib/admin/schema-generator";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GenericForm } from "./generic-form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { adminTableConfig } from "@/lib/admin/config";
import { FieldValues } from "react-hook-form";

interface RecordItem {
  id: string | number;
  [key: string]: unknown;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to determine if a value is a valid date
function isDateValue(value: unknown): boolean {
  if (!value) return false;

  // If it's already a Date object
  if (value instanceof Date) return !isNaN(value.getTime());

  // If it's a string that looks like a date
  if (typeof value === "string") {
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // ISO date
      /^\d{2}\/\d{2}\/\d{4}/, // US date
      /GMT|UTC/i, // GMT/UTC strings
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    ];

    if (datePatterns.some((pattern) => pattern.test(value))) {
      const testDate = new Date(value);
      return !isNaN(testDate.getTime());
    }
  }

  // If it's a number (timestamp)
  if (typeof value === "number") {
    const testDate = new Date(value);
    return !isNaN(testDate.getTime());
  }

  return false;
}

// Enhanced helper function to format date with better error handling
function formatDate(date: unknown): string {
  try {
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === "string" || typeof date === "number") {
      dateObj = new Date(date);
    } else {
      return String(date);
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return String(date);
    }

    // Format as MM/dd/yyyy HH:mm
    const formatted =
      dateObj.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }) +
      " " +
      dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

    return formatted;
  } catch {
    // Fallback to string representation
    return String(date);
  }
}

interface GenericTableManagerProps {
  tableName: EnabledTableKeys;
  schemaInfo: SchemaInfo;
  initialData: RecordItem[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function GenericTableManager({
  tableName,
  schemaInfo,
  initialData,
  initialPagination,
}: GenericTableManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set(),
  );

  const queryAction = useCallback(
    (args: { page: number; limit: number; search?: string }) =>
      getGenericTableData(tableName, args),
    [tableName],
  );

  const {
    data,
    pagination,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    refresh,
  } = useAdminTable<RecordItem>({
    queryAction,
    initialData,
    initialPagination,
  });

  const tableConfig = useMemo(
    () => adminTableConfig[tableName] ?? {},
    [tableName],
  );

  const handleDelete = useCallback(
    async (ids: (string | number)[]) => {
      if (ids.length === 0) return;
      if (!confirm(`Are you sure you want to delete ${ids.length} record(s)?`))
        return;

      startTransition(async () => {
        const result = await deleteRecords({ tableName, ids });
        if (result.serverError) {
          toast.error(result.serverError);
        } else {
          toast.success(
            `Successfully deleted ${result.data?.count} record(s).`,
          );
          refresh();
          setSelectedIds(new Set());
        }
      });
    },
    [tableName, refresh],
  );

  const columns = useMemo(() => {
    const visibleColumns = schemaInfo.filter(
      (col) => !tableConfig.hiddenColumns?.includes(col.name),
    );

    return [
      {
        key: "select",
        label: (
          <Checkbox
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedIds(new Set(data.map((item) => item.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
            checked={data.length > 0 && selectedIds.size === data.length}
            aria-label="Select all rows"
          />
        ),
        render: (item: RecordItem) => (
          <Checkbox
            checked={selectedIds.has(item.id)}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) => {
                const newSet = new Set(prev);
                if (checked) newSet.add(item.id);
                else newSet.delete(item.id);
                return newSet;
              });
            }}
            aria-label={`Select row ${item.id}`}
          />
        ),
      },
      ...visibleColumns.map((col) => ({
        key: col.name,
        label: col.name,
        render: (item: RecordItem) => {
          const value = item[col.name];

          // Handle null/undefined values
          if (value === null || value === undefined || value === "") {
            return <span className="text-gray-400 italic">—</span>;
          }

          switch (col.type) {
            case "boolean":
              return (
                <Badge variant={value ? "default" : "secondary"}>
                  {String(value)}
                </Badge>
              );

            case "email":
              return (
                <a
                  href={`mailto:${value}`}
                  className="block max-w-xs truncate text-blue-600 hover:underline"
                >
                  {String(value)}
                </a>
              );

            case "url":
              return (
                <a
                  href={String(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-xs truncate text-blue-600 hover:underline"
                >
                  {String(value)}
                </a>
              );

            case "phone":
              return (
                <a
                  href={`tel:${value}`}
                  className="block max-w-xs truncate text-blue-600 hover:underline"
                >
                  {String(value)}
                </a>
              );

            case "color":
              return (
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded border"
                    style={{ backgroundColor: String(value) }}
                  />
                  <span className="font-mono text-sm">{String(value)}</span>
                </div>
              );

            case "currency":
              return (
                <span className="font-mono">
                  $
                  {Number(value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              );

            case "filesize":
              return (
                <span className="font-mono text-sm">
                  {formatFileSize(Number(value))}
                </span>
              );

            case "tags":
              const tags = Array.isArray(value)
                ? value
                : String(value)
                    .split(",")
                    .map((t) => t.trim());
              return (
                <div className="flex max-w-xs flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tags.length - 3}
                    </Badge>
                  )}
                </div>
              );

            case "date":
              return (
                <span className="font-mono text-sm">{formatDate(value)}</span>
              );

            case "user_id":
            case "foreign_key":
              // Check if we have enhanced reference data
              const refKey = `${col.name}_ref`;
              const refData = item[refKey] as
                | {
                    id: string;
                    name?: string;
                    title?: string;
                    email?: string;
                    username?: string;
                    _tableName: string;
                    _displayField: string;
                    [key: string]: unknown;
                  }
                | undefined;

              if (refData) {
                // Get the display value from the reference data
                const displayValue =
                  refData[refData._displayField] ||
                  refData.name ||
                  refData.title ||
                  refData.id;
                const secondaryValue = refData.email || refData.username;

                // Choose icon based on table type
                const icon =
                  col.type === "user_id" || refData._tableName === "users"
                    ? "👤"
                    : refData._tableName === "products"
                      ? "📦"
                      : refData._tableName === "orders"
                        ? "🛒"
                        : refData._tableName === "payments"
                          ? "💳"
                          : refData._tableName === "subscriptions"
                            ? "📋"
                            : "🔗";

                return (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs">
                      {icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {String(displayValue)}
                      </span>
                      {secondaryValue && (
                        <span className="text-xs text-gray-500">
                          {String(secondaryValue)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Fallback to showing just the ID with table info
              const tableInfo = col.foreignKey?.table;
              return (
                <Badge variant="outline" className="font-mono text-xs">
                  {col.type === "user_id" ? "👤" : "🔗"}{" "}
                  {tableInfo ? `${tableInfo}:` : ""}
                  {String(value)}
                </Badge>
              );

            case "file":
            case "image":
              return (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {col.type === "image" ? "📷" : "📁"}
                  </Badge>
                  <span className="max-w-xs truncate text-sm">
                    {String(value)}
                  </span>
                </div>
              );

            case "password":
              return (
                <span className="font-mono text-gray-400">{"•".repeat(8)}</span>
              );

            case "textarea":
            case "richtext":
            case "markdown":
              return (
                <div className="max-w-xs">
                  <span className="line-clamp-2 text-sm">{String(value)}</span>
                </div>
              );

            case "json":
              if (typeof value === "object" && value !== null) {
                return (
                  <pre className="max-w-xs truncate rounded bg-gray-50 p-1 text-xs">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                );
              }
              return (
                <span className="block max-w-xs truncate text-sm">
                  {String(value)}
                </span>
              );

            default:
              // Last resort: check if the value looks like a date
              if (isDateValue(value)) {
                return (
                  <span className="font-mono text-sm">{formatDate(value)}</span>
                );
              }

              return (
                <span className="block max-w-xs truncate">{String(value)}</span>
              );
          }
        },
      })),
      {
        key: "actions",
        label: "Actions",
        render: (item: RecordItem) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingRecord(item);
                setIsFormOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete([item.id])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [schemaInfo, tableConfig, data, selectedIds, handleDelete]);

  const handleFormSubmit = async (formData: FieldValues) => {
    startTransition(async () => {
      let result;
      if (editingRecord) {
        result = await updateRecord({
          tableName,
          id: editingRecord.id,
          data: formData,
        });
      } else {
        result = await createRecord({ tableName, data: formData });
      }

      if (result?.serverError || result?.validationErrors) {
        toast.error(result.serverError || "Validation failed");
      } else {
        toast.success(
          `Record ${editingRecord ? "updated" : "created"} successfully.`,
        );
        refresh();
        setIsFormOpen(false);
        setEditingRecord(null);
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Data for: {tableName}</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingRecord(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      <AdminTableBase<RecordItem>
        data={data}
        columns={columns}
        loading={loading || isPending}
        error={error}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        pagination={pagination}
        onPageChange={setCurrentPage}
        searchPlaceholder={`Search in ${tableName}...`}
        emptyMessage={`No records found in ${tableName}.`}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRecord
                ? `Edit record in ${tableName}`
                : `Create new record in ${tableName}`}
            </DialogTitle>
          </DialogHeader>
          <GenericForm
            schemaInfo={schemaInfo}
            readOnlyColumns={tableConfig.readOnlyColumns}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            defaultValues={editingRecord}
            isSubmitting={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
