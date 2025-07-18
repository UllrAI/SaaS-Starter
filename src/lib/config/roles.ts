import { userRoleEnum } from "@/database/schema";

// 从数据库 schema 导出角色类型，确保单一事实来源
export type UserRole = (typeof userRoleEnum.enumValues)[number];

// 角色层级配置 - 数字越大权限越高
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
} as const;

/**
 * 检查用户是否具有所需角色权限
 * @param userRole 用户当前角色
 * @param requiredRole 所需的最低角色
 * @returns 是否具有权限
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * 获取所有可用角色
 */
export function getAllRoles(): UserRole[] {
  return userRoleEnum.enumValues as UserRole[];
}

/**
 * 获取角色的层级值
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}

/**
 * 检查角色是否为管理员级别（admin 或更高）
 */
export function isAdminRole(role: UserRole): boolean {
  return hasRole(role, "admin");
}

/**
 * 检查角色是否为超级管理员
 */
export function isSuperAdminRole(role: UserRole): boolean {
  return role === "super_admin";
}
