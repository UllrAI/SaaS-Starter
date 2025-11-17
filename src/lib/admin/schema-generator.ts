import { getTableConfig, AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { type EnabledTableKeys } from "@/lib/config/admin-tables";
import { adminTableConfig } from "./config";
import { type ColumnType, type SchemaInfo, type ColumnInfo } from "./types";
import { users } from "@/database/schema";

export { type ColumnType, type ColumnInfo, type SchemaInfo } from "./types";

const drizzleTypeToTsType: Record<string, ColumnType> = {
  PgText: "string",
  PgVarchar: "string",
  PgChar: "string",
  PgInteger: "number",
  PgBigInt53: "number",
  PgBoolean: "boolean",
  PgTimestamp: "date",
  PgDate: "date",
  PgEnum: "enum",
  PgJsonb: "json",
  PgUUID: "uuid",
};

// Helper function to detect field type based on column name patterns
function detectColumnTypeByName(
  columnName: string,
  baseType: ColumnType,
): ColumnType {
  const name = columnName.toLowerCase();

  // Date/Time detection (PRIORITY: Handle first to override other detections)
  if (
    name === "createdat" ||
    name === "created_at" ||
    name === "updatedat" ||
    name === "updated_at" ||
    name === "deletedat" ||
    name === "deleted_at" ||
    name.includes("time") ||
    name.includes("date") ||
    (name.endsWith("at") &&
      (name.includes("created") ||
        name.includes("updated") ||
        name.includes("deleted")))
  ) {
    return "date";
  }

  // Email detection (exact matches or clear email fields)
  if (
    name === "email" ||
    name === "useremail" ||
    name === "emailaddress" ||
    name.endsWith("email")
  ) {
    return "email";
  }

  // URL detection (exact matches or clear URL fields)
  if (
    name === "url" ||
    name === "link" ||
    name === "website" ||
    name === "homepage" ||
    name.endsWith("url") ||
    name.endsWith("link")
  ) {
    return "url";
  }

  // Phone detection (exact matches or clear phone fields)
  if (
    name === "phone" ||
    name === "mobile" ||
    name === "tel" ||
    name === "telephone" ||
    name.endsWith("phone") ||
    name.endsWith("mobile")
  ) {
    return "phone";
  }

  // Color detection (exact matches)
  if (
    name === "color" ||
    name === "colour" ||
    name.endsWith("color") ||
    name.endsWith("colour")
  ) {
    return "color";
  }

  // File size detection (for number fields)
  if (
    baseType === "number" &&
    (name === "filesize" ||
      name === "file_size" ||
      name === "size" ||
      name.endsWith("size") ||
      name.toLowerCase().includes("filesize"))
  ) {
    return "filesize";
  }

  // Currency detection (for number fields) - be more specific
  if (
    baseType === "number" &&
    (name.includes("price") ||
      name.includes("amount") ||
      name.includes("cost") ||
      name.includes("fee") ||
      name.includes("salary") ||
      name === "currency")
  ) {
    return "currency";
  }

  // File name detection (not file upload, just display)
  if (
    name === "filename" ||
    name === "file_name" ||
    name === "originalname" ||
    name === "original_name"
  ) {
    return "file"; // Special handling for file names
  }

  // Image detection (only for actual image fields, not URLs)
  if (
    (name === "image" ||
      name === "avatar" ||
      name === "photo" ||
      name === "picture") &&
    baseType === "string" &&
    !name.includes("url")
  ) {
    return "image";
  }

  // Rich text detection (exact matches)
  if (
    name.includes("richtext") ||
    name.includes("rich_text") ||
    name.includes("html")
  ) {
    return "richtext";
  }

  // Markdown detection (exact matches)
  if (name.includes("markdown") || name.includes("md")) {
    return "markdown";
  }

  // Tags detection (exact matches for tag fields)
  if (
    name === "tags" ||
    name === "keywords" ||
    name === "labels" ||
    name.endsWith("tags")
  ) {
    return "tags";
  }

  // Password detection (exact matches)
  if (
    name === "password" ||
    name === "passwd" ||
    name === "secret" ||
    name.endsWith("password")
  ) {
    return "password";
  }

  // Textarea detection for long text fields (more specific)
  if (
    baseType === "string" &&
    (name.includes("description") ||
      name.includes("content") ||
      name.includes("note") ||
      name.includes("comment") ||
      name.includes("message") ||
      name.includes("bio") ||
      name.includes("summary"))
  ) {
    return "textarea";
  }

  return baseType;
}

// Helper function to determine the best display field for a foreign table
export function getDisplayFieldForTable(tableName: string): string {
  // Table-specific display field preferences
  const tableDisplayFields: Record<string, string> = {
    users: "name",
    user: "name",
    categories: "name",
    category: "name",
    products: "name",
    product: "name",
    orders: "id", // For orders, ID might be more meaningful
    order: "id",
    payments: "id",
    payment: "id",
    subscriptions: "id",
    subscription: "id",
  };

  // Check if we have a specific preference for this table
  if (tableDisplayFields[tableName]) {
    return tableDisplayFields[tableName];
  }

  // Default fallback: use 'name' if available, otherwise 'id'
  return "name";
}

export function getTableSchema(
  table: PgTable,
  tableName: EnabledTableKeys,
): SchemaInfo {
  const tableDetails = getTableConfig(table);
  const config = adminTableConfig[tableName] ?? {};
  const userRelatedColumn =
    typeof config.userRelated === "string"
      ? config.userRelated
      : config.userRelated
        ? "userId"
        : null;
  const userTableName = getTableConfig(users).name;

  return tableDetails.columns.map((column: AnyPgColumn) => {
    let columnType: ColumnType =
      drizzleTypeToTsType[column.dataType] || "string";

    const foreignKey = tableDetails.foreignKeys.find((fk) =>
      fk.reference().columns.some((c: AnyPgColumn) => c.name === column.name),
    );

    const foreignTableName = foreignKey
      ? getTableConfig(foreignKey.reference().foreignTable).name
      : undefined;
    const isUserIdFk = foreignTableName === userTableName;

    let foreignKeyInfo: ColumnInfo["foreignKey"] = undefined;

    // Handle user relationship
    if (column.name === userRelatedColumn && isUserIdFk) {
      columnType = "user_id";
      foreignKeyInfo = {
        table: foreignTableName!,
        column: foreignKey!.reference().columns[0].name,
        displayField: "name", // Default to 'name' field for users
      };
    }
    // Handle foreign key relationships (non-user)
    else if (foreignKey && !isUserIdFk) {
      columnType = "foreign_key";
      foreignKeyInfo = {
        table: foreignTableName!,
        column: foreignKey!.reference().columns[0].name,
        displayField: getDisplayFieldForTable(foreignTableName!), // Determine display field
      };
    }
    // Apply intelligent type detection based on column name
    else {
      columnType = detectColumnTypeByName(column.name, columnType);
    }

    const isPrimaryKey = column.primary;
    const isOptional = !column.notNull || column.hasDefault || isPrimaryKey;

    return {
      name: column.name,
      type: columnType,
      isOptional,
      isPrimaryKey,
      isAutoGenerated: column.hasDefault && isPrimaryKey,
      enumValues:
        "enumValues" in column ? (column.enumValues as string[]) : undefined,
      foreignKey: foreignKeyInfo,
    };
  });
}

export function generateZodSchema(
  schemaInfo: SchemaInfo,
  readOnlyColumns: string[] = [],
): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodType> = {};

  schemaInfo.forEach((col) => {
    if (col.isAutoGenerated || readOnlyColumns.includes(col.name)) return;

    let fieldSchema: z.ZodType;

    switch (col.type) {
      case "string":
      case "uuid":
      case "user_id":
      case "foreign_key":
        fieldSchema = z.string();
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "email":
        fieldSchema = z.string().email("Please enter a valid email address");
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "url":
        fieldSchema = z.string().url("Please enter a valid URL");
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "phone":
        fieldSchema = z
          .string()
          .regex(/^[+]?[\d\s\-()]+$/, "Please enter a valid phone number");
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "color":
        fieldSchema = z
          .string()
          .regex(
            /^#[0-9A-Fa-f]{6}$/,
            "Please enter a valid color (e.g., #FF0000)",
          );
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "text":
      case "textarea":
      case "richtext":
      case "markdown":
      case "file":
      case "image":
      case "password":
        fieldSchema = z.string();
        if (!col.isOptional) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, {
            message: "This field is required",
          });
        }
        break;
      case "tags":
        fieldSchema = z.string().transform((str) => {
          if (!str) return [];
          return str
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
        });
        break;
      case "number":
        fieldSchema = z.coerce.number();
        break;
      case "currency":
        fieldSchema = z.coerce.number().min(0, "Amount must be positive");
        break;
      case "filesize":
        fieldSchema = z.coerce.number().min(0, "File size must be positive");
        break;
      case "boolean":
        fieldSchema = z.boolean().default(false);
        break;
      case "date":
        fieldSchema = z.preprocess((arg) => {
          if (typeof arg == "string" && arg) return new Date(arg);
          if (!arg) return undefined;
          return arg;
        }, z.date().optional());
        break;
      case "enum":
        if (col.enumValues && col.enumValues.length > 0) {
          fieldSchema = z.enum(col.enumValues as [string, ...string[]]);
        } else {
          fieldSchema = z.string();
        }
        break;
      case "json":
        fieldSchema = z
          .string()
          .transform((str, ctx) => {
            if (!str) return null;
            try {
              return JSON.parse(str);
            } catch {
              ctx.addIssue({ code: "custom", message: "Invalid JSON" });
              return z.NEVER;
            }
          })
          .pipe(z.any());
        break;
      default:
        // This should not happen with the current types, but as a fallback:
        fieldSchema = z.any();
    }

    if (col.isOptional) {
      shape[col.name] = fieldSchema.optional().nullable();
    } else {
      shape[col.name] = fieldSchema;
    }
  });

  return z.object(shape);
}
