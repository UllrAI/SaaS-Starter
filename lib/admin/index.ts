// 统一导出 admin 相关的类型和配置
export { type TableConfig, type ColumnType, type ColumnInfo, type SchemaInfo } from "./types";
export { adminTableConfig, getTableConfig, isUserRelatedTable, getUserRelatedColumn } from "./config";
export { getTableSchema } from "./schema-generator";
export { getAdminStats, type AdminStatsWithCharts, type ChartData, type UploadStatsDetails } from "./stats";