import type { TableConfig } from "./types";
import type { EnabledTableKeys } from "@/lib/config/admin-tables";

/**
 * 管理员表格配置对象
 * key: 必须与 enabledTablesMap 中的 key 保持一致。
 */
export const adminTableConfig: Partial<Record<EnabledTableKeys, TableConfig>> = {
    uploads: {
        userRelated: "userId", // 指定关联用户表的列名
        hiddenColumns: ["token"], // 在UI中隐藏的列
        readOnlyColumns: ["id", "createdAt"], // 只读列
    },
};

/**
 * 获取指定表的配置
 */
export function getTableConfig(tableName: EnabledTableKeys): TableConfig {
    return adminTableConfig[tableName] || {
        userRelated: false,
        hiddenColumns: [],
        readOnlyColumns: ["id", "createdAt", "updatedAt"],
    };
}

/**
 * 检查表是否与用户关联
 */
export function isUserRelatedTable(tableName: EnabledTableKeys): boolean {
    const config = getTableConfig(tableName);
    return Boolean(config.userRelated);
}

/**
 * 获取用户关联的列名
 */
export function getUserRelatedColumn(tableName: EnabledTableKeys): string | null {
    const config = getTableConfig(tableName);
    if (typeof config.userRelated === "string") {
        return config.userRelated;
    }
    if (config.userRelated === true) {
        return "userId";
    }
    return null;
}