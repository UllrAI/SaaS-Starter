"use server";

import { db } from "@/database";
import {
  enabledTablesMap,
  type EnabledTableKeys,
} from "@/lib/config/admin-tables";
import { requireAdmin } from "@/lib/auth/permissions";
import { createSafeActionClient } from "next-safe-action";
import { count, eq, ilike, inArray, or, SQL, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AnyPgColumn, PgTable, getTableConfig } from "drizzle-orm/pg-core";
import {
  getTableSchema,
  getDisplayFieldForTable,
} from "@/lib/admin/schema-generator";

interface RecordWithId {
  id: string | number;
  [key: string]: unknown;
}

const action = createSafeActionClient();

const adminAction = action.use(async ({ next }) => {
  const user = await requireAdmin();
  return next({
    ctx: {
      user,
    },
  });
});

// Helper function to enhance records with foreign key data
async function enhanceRecordsWithForeignKeys(
  records: RecordWithId[],
  tableName: EnabledTableKeys,
): Promise<RecordWithId[]> {
  if (records.length === 0) return records;

  const table = enabledTablesMap[tableName];
  const schemaInfo = getTableSchema(table, tableName);

  // Find columns with foreign key relationships
  const foreignKeyColumns = schemaInfo.filter((col) => col.foreignKey);

  if (foreignKeyColumns.length === 0) return records;

  // Group foreign key columns by target table
  const foreignKeysByTable = new Map<string, typeof foreignKeyColumns>();
  for (const col of foreignKeyColumns) {
    if (col.foreignKey) {
      const targetTable = col.foreignKey.table;
      if (!foreignKeysByTable.has(targetTable)) {
        foreignKeysByTable.set(targetTable, []);
      }
      foreignKeysByTable.get(targetTable)!.push(col);
    }
  }

  // Fetch data for each referenced table
  const enhancedRecords = [...records];

  for (const [targetTableName, columns] of foreignKeysByTable) {
    // Check if the target table is enabled
    if (!(targetTableName in enabledTablesMap)) continue;

    const targetTable = enabledTablesMap[targetTableName as EnabledTableKeys];

    // Collect all unique IDs for this target table
    const targetIds = new Set<string>();
    for (const record of records) {
      for (const col of columns) {
        const id = record[col.name];
        if (id && typeof id === "string") {
          targetIds.add(id);
        }
      }
    }

    if (targetIds.size === 0) continue;

    try {
      // Get the display field for this table
      const displayField = getDisplayFieldForTable(targetTableName);

      // Build select fields dynamically
      const selectFields: Record<string, AnyPgColumn> = {
        id: (targetTable as PgTable & { id: AnyPgColumn }).id,
      };

      // Add common display fields if they exist on the table
      const tableConfig = getTableConfig(targetTable);
      const tableColumns = tableConfig.columns;

      // Try to add name, title, email fields if they exist
      const possibleDisplayFields = [
        displayField,
        "name",
        "title",
        "email",
        "username",
      ];
      for (const fieldName of possibleDisplayFields) {
        const column = tableColumns.find(
          (c: AnyPgColumn) => c.name === fieldName,
        );
        if (column) {
          selectFields[fieldName] = column;
        }
      }

      // Fetch the referenced data
      const referencedData = await db
        .select(selectFields)
        .from(targetTable)
        .where(
          inArray(
            (targetTable as PgTable & { id: AnyPgColumn }).id,
            Array.from(targetIds),
          ),
        );

      // Create lookup map
      const dataMap = new Map(
        referencedData.map((item: Record<string, unknown>) => [item.id, item]),
      );

      // Enhance records with referenced data
      for (let i = 0; i < enhancedRecords.length; i++) {
        for (const col of columns) {
          const foreignId = enhancedRecords[i][col.name];
          if (foreignId && typeof foreignId === "string") {
            const referencedItem = dataMap.get(foreignId);
            if (referencedItem) {
              // Add the referenced data with a suffix
              enhancedRecords[i][`${col.name}_ref`] = {
                ...referencedItem,
                _tableName: targetTableName,
                _displayField: displayField,
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch data for table ${targetTableName}:`, error);
      // Continue with other tables even if one fails
    }
  }

  return enhancedRecords;
}

export async function getGenericTableData(
  tableName: EnabledTableKeys,
  options: {
    page: number;
    limit: number;
    search?: string;
    sort?: { by: string; order: "asc" | "desc" };
  },
): Promise<{
  data: RecordWithId[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const table = enabledTablesMap[tableName];
  const { page, limit, search } = options;
  const offset = (page - 1) * limit;

  const tableColumns = getTableConfig(table).columns;
  const textColumns = tableColumns.filter(
    // FIX: Use `getSQLType()` which returns string literals like 'text'
    (c): c is AnyPgColumn =>
      c.getSQLType() === "text" || c.getSQLType().includes("varchar"),
  );

  const whereConditions: SQL[] = [];
  if (search && textColumns.length > 0) {
    whereConditions.push(
      or(...textColumns.map((col) => ilike(col, `%${search}%`)))!,
    );
  }

  const finalWhere =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const dataQuery = db
    .select()
    .from(table)
    .where(finalWhere)
    .limit(limit)
    .offset(offset);
  const totalQuery = db
    .select({ total: count() })
    .from(table)
    .where(finalWhere);

  const [data, [{ total }]] = await Promise.all([dataQuery, totalQuery]);

  // Enhance data with foreign key information
  const enhancedData = await enhanceRecordsWithForeignKeys(
    data as RecordWithId[],
    tableName,
  );

  return {
    data: enhancedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const tableNameSchema = z.custom<EnabledTableKeys>((val) =>
  Object.keys(enabledTablesMap).includes(val as string),
);

export const createRecord = adminAction
  .schema(
    z.object({
      tableName: tableNameSchema,
      data: z.record(z.unknown()),
    }),
  )
  .action(async ({ parsedInput: { tableName, data } }) => {
    const table = enabledTablesMap[tableName];
    // Remove undefined values and auto-generated fields to avoid type conflicts
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );

    // Use type assertion for Drizzle insert - this is safe as data is validated on client
    const [newRecord] = await db
      .insert(table)
      .values(cleanData as never)
      .returning();
    revalidatePath(`/dashboard/admin/tables/${tableName}`);
    return { record: newRecord };
  });

export const updateRecord = adminAction
  .schema(
    z.object({
      tableName: tableNameSchema,
      id: z.union([z.string(), z.number()]),
      data: z.record(z.unknown()),
    }),
  )
  .action(async ({ parsedInput: { tableName, id, data } }) => {
    const table = enabledTablesMap[tableName] as PgTable & { id: AnyPgColumn };
    // Remove undefined values to avoid type conflicts
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );

    type UpdateType = Partial<typeof table.$inferSelect>;
    const [updatedRecord] = await db
      .update(table)
      .set(cleanData as UpdateType)
      .where(eq(table.id, id))
      .returning();
    revalidatePath(`/dashboard/admin/tables/${tableName}`);
    return { record: updatedRecord };
  });

export const deleteRecords = adminAction
  .schema(
    z.object({
      tableName: tableNameSchema,
      ids: z.array(z.union([z.string(), z.number()])).min(1),
    }),
  )
  .action(async ({ parsedInput: { tableName, ids } }) => {
    const table = enabledTablesMap[tableName] as PgTable & { id: AnyPgColumn };
    const result = await db
      .delete(table)
      .where(inArray(table.id, ids))
      .returning();
    revalidatePath(`/dashboard/admin/tables/${tableName}`);
    return { success: true, count: result.length };
  });
