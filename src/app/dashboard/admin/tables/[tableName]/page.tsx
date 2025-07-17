import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardPageWrapper } from "@/app/dashboard/_components/dashboard-page-wrapper";
import { createMetadata } from "@/lib/metadata";
import { getTableSchema } from "@/lib/admin/schema-generator";
import { getGenericTableData } from "@/lib/actions/admin-generic";
import { GenericTableManager } from "@/components/admin/generic-table/generic-table-manager";
import { enabledTablesMap, type EnabledTableKeys } from "@/lib/config/admin-tables";
import { Skeleton } from "@/components/ui/skeleton";

interface GenericTablePageProps {
    params: Promise<{
        tableName: EnabledTableKeys;
    }>;
}

export async function generateMetadata({ params }: GenericTablePageProps) {
    const { tableName } = await params;
    const capitalizedTableName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
    return createMetadata({
        title: `Manage ${capitalizedTableName}`,
        description: `CRUD interface for the ${tableName} table.`,
    });
}

export default async function GenericTablePage({ params }: GenericTablePageProps) {
    const { tableName } = await params;

    if (!(tableName in enabledTablesMap)) {
        notFound();
    }

    const tableSchema = enabledTablesMap[tableName];
    const schemaInfo = getTableSchema(tableSchema, tableName);

    // FIX: Cast initialData to the correct type
    const initialData = await getGenericTableData(tableName, { page: 1, limit: 10 });

    return (
        <DashboardPageWrapper
            title={`Manage: ${tableName}`}
            parentTitle="Admin Dashboard"
            parentUrl="/dashboard/admin"
        >
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <GenericTableManager
                    tableName={tableName}
                    schemaInfo={schemaInfo}
                    initialData={initialData.data}
                    initialPagination={initialData.pagination}
                />
            </Suspense>
        </DashboardPageWrapper>
    );
}