import * as schema from "@/database/schema";

/**
 * 在这里声明您希望通过通用表格管理器进行管理的业务表。
 * key: 表的URL路径名 (例如, 'uploads')
 * value: 从 @/database/schema 导出的 Drizzle 表对象 (例如, schema.uploads)
 */
export const enabledTablesMap = {
  uploads: schema.uploads,
  sessions: schema.sessions,
  payments: schema.payments,
  subscriptions: schema.subscriptions,
  users: schema.users,
  verifications: schema.verifications,
  // 示例: 如果您有一个 "products" 表, 在这里添加:
  // products: schema.products,
} as const;

export type EnabledTableKeys = keyof typeof enabledTablesMap;
export type EnabledTable = (typeof enabledTablesMap)[EnabledTableKeys];
