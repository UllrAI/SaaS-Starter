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

  return {
    data: data as RecordWithId[],
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
