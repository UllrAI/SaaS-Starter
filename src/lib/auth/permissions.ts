import { auth } from "./server";
import { redirect } from "next/navigation";
import { UserRole, hasRole as checkRole } from "@/lib/config/roles";

// 重新导出 UserRole 类型以保持向后兼容性
export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

/**
 * Get current session and user data
 * Note: This function should only be used in server components
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // This will only work in server components where headers are available
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as { role?: UserRole }).role || "user",
      image: session.user.image || undefined,
    };
  } catch {
    // Handle cases where this is called in client-side context
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return checkRole(userRole, requiredRole);
}

/**
 * Require authentication and optionally a specific role
 */
export async function requireAuth(requiredRole?: UserRole): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && !hasRole(user.role, requiredRole)) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireAuth("admin");
}

/**
 * Require super admin role
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  return requireAuth("super_admin");
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? hasRole(user.role, "admin") : false;
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? hasRole(user.role, "super_admin") : false;
}
