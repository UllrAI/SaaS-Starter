"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AdminTableBase } from "@/components/admin/admin-table-base";
import { useAdminTable } from "@/hooks/use-admin-table";
import { getGenericTableData, createRecord, updateRecord, deleteRecords } from "@/lib/actions/admin-generic";
import type { EnabledTableKeys } from "@/lib/config/admin-tables";
import type { SchemaInfo } from "@/lib/admin/schema-generator";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GenericForm } from "./generic-form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatarCell } from "../user-avatar-cell";
import { adminTableConfig } from "@/lib/admin/config";
import { FieldValues } from "react-hook-form";

interface RecordItem {
    id: string | number;
    [key: string]: unknown;
}

interface GenericTableManagerProps {
    tableName: EnabledTableKeys;
    schemaInfo: SchemaInfo;
    initialData: RecordItem[];
    initialPagination: { page: number; limit: number; total: number; totalPages: number };
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
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

    const queryAction = useCallback(
        (args: { page: number; limit: number; search?: string }) => getGenericTableData(tableName, args),
        [tableName]
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
    } = useAdminTable<RecordItem>({ queryAction, initialData, initialPagination });

    const tableConfig = useMemo(() => adminTableConfig[tableName] ?? {}, [tableName]);

    const handleDelete = useCallback(async (ids: (string | number)[]) => {
        if (ids.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${ids.length} record(s)?`)) return;

        startTransition(async () => {
            const result = await deleteRecords({ tableName, ids });
            if (result.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(`Successfully deleted ${result.data?.count} record(s).`);
                refresh();
                setSelectedIds(new Set());
            }
        });
    }, [tableName, refresh]);

    const columns = useMemo(() => {
        const userRelatedColumn = typeof tableConfig.userRelated === 'string' ? tableConfig.userRelated : (tableConfig.userRelated ? 'userId' : null);
        const visibleColumns = schemaInfo.filter(col => !tableConfig.hiddenColumns?.includes(col.name));

        return [
            {
                key: "select",
                label: (
                    <Checkbox
                        onCheckedChange={(checked) => {
                            if (checked) {
                                setSelectedIds(new Set(data.map(item => item.id)));
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
                            setSelectedIds(prev => {
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
                    if (col.type === "boolean") {
                        return <Badge variant={value ? "default" : "secondary"}>{String(value)}</Badge>;
                    }
                    if (col.type === "date" && value) {
                        return new Date(value as string).toLocaleString();
                    }
                    if (col.type === "user_id" && userRelatedColumn) {
                        return <UserAvatarCell name={item.id.toString()} email={item[userRelatedColumn] as string} />;
                    }
                    if (typeof value === "object" && value !== null) {
                        return <pre className="text-xs max-w-xs truncate">{JSON.stringify(value, null, 2)}</pre>;
                    }
                    return <span className="max-w-xs truncate block">{String(value ?? '')}</span>;
                },
            })),
            {
                key: "actions",
                label: "Actions",
                render: (item: RecordItem) => (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(item); setIsFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete([item.id])}>
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
                result = await updateRecord({ tableName, id: editingRecord.id, data: formData });
            } else {
                result = await createRecord({ tableName, data: formData });
            }

            if (result?.serverError || result?.validationErrors) {
                toast.error(result.serverError || "Validation failed");
            } else {
                toast.success(`Record ${editingRecord ? "updated" : "created"} successfully.`);
                refresh();
                setIsFormOpen(false);
                setEditingRecord(null);
            }
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Data for: {tableName}</h2>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={() => handleDelete(Array.from(selectedIds))} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
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
                            {editingRecord ? `Edit record in ${tableName}` : `Create new record in ${tableName}`}
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