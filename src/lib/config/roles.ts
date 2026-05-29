import { userRoleEnum } from "@/database/schema";

// Derive role types from the database schema as the single source of truth.
export type UserRole = (typeof userRoleEnum.enumValues)[number];

// Role hierarchy; higher numbers have broader permissions.
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
} as const;

/**
 * Check whether the user has the required role.
 * @param userRole Current user role
 * @param requiredRole Minimum required role
 * @returns Whether the role has permission
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all available roles.
 */
export function getAllRoles(): UserRole[] {
  return userRoleEnum.enumValues as UserRole[];
}

/**
 * Get the hierarchy level for a role.
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}

/**
 * Check whether a role has admin-level access.
 */
export function isAdminRole(role: UserRole): boolean {
  return hasRole(role, "admin");
}

/**
 * Check whether a role is a super admin.
 */
export function isSuperAdminRole(role: UserRole): boolean {
  return role === "super_admin";
}
