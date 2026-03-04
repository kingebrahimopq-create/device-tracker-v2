import { TRPCError } from "@trpc/server";
import { User, Device } from "../drizzle/schema";
import { getUserDevicePermission, createAuditTrail, getUserById } from "./db";

/**
 * Permission levels for device access
 */
export type PermissionLevel = "view" | "edit" | "admin";

/**
 * Role-based access levels
 */
export type UserRole = "admin" | "manager" | "user";

/**
 * Check if user has admin role
 */
export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

/**
 * Check if user has manager role or higher
 */
export function isManagerOrAbove(user: User): boolean {
  return user.role === "admin" || user.role === "manager";
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User, role: UserRole): boolean {
  return user.role === role;
}

/**
 * Check if user can access a specific device
 */
export async function canAccessDevice(
  user: User,
  device: Device,
  requiredPermission: PermissionLevel = "view"
): Promise<boolean> {
  // Admin can access everything
  if (isAdmin(user)) {
    return true;
  }

  // Device owner can access their own devices
  if (device.ownerId === user.id) {
    return true;
  }

  // Check explicit permissions
  const permission = await getUserDevicePermission(device.id, user.id);
  if (!permission) {
    return false;
  }

  // Check if permission level is sufficient
  const permissionHierarchy: Record<PermissionLevel, number> = {
    view: 1,
    edit: 2,
    admin: 3,
  };

  const requiredLevel = permissionHierarchy[requiredPermission];
  const userLevel = permissionHierarchy[permission.permission];

  return userLevel >= requiredLevel;
}

/**
 * Check if user can grant permissions on a device
 */
export async function canGrantPermission(user: User, device: Device): Promise<boolean> {
  // Admin can grant permissions
  if (isAdmin(user)) {
    return true;
  }

  // Device owner can grant permissions
  if (device.ownerId === user.id) {
    return true;
  }

  // Check if user has admin permission on the device
  const permission = await getUserDevicePermission(device.id, user.id);
  return permission?.permission === "admin";
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: User): boolean {
  return isAdmin(user) || user.role === "manager";
}

/**
 * Check if user can view activity logs
 */
export function canViewActivityLogs(user: User): boolean {
  return isAdmin(user) || user.role === "manager";
}

/**
 * Check if user can view all alerts
 */
export function canViewAllAlerts(user: User): boolean {
  return isAdmin(user) || user.role === "manager";
}

/**
 * Check if user can export reports
 */
export function canExportReports(user: User): boolean {
  return isAdmin(user) || user.role === "manager";
}

/**
 * Check if user can create devices
 */
export function canCreateDevices(user: User): boolean {
  return isAdmin(user) || user.role === "manager";
}

/**
 * Check if user can delete devices
 */
export function canDeleteDevices(user: User): boolean {
  return isAdmin(user);
}

/**
 * Check if user can modify device settings
 */
export async function canModifyDevice(user: User, device: Device): Promise<boolean> {
  // Admin can modify everything
  if (isAdmin(user)) {
    return true;
  }

  // Device owner can modify their own devices
  if (device.ownerId === user.id) {
    return true;
  }

  // Check if user has edit permission
  return await canAccessDevice(user, device, "edit");
}

/**
 * Create audit trail entry for permission changes
 */
export async function auditPermissionChange(
  actingUserId: number,
  targetUserId: number | null,
  action: string,
  resourceType: string,
  resourceId: number | null,
  changes: Record<string, any>,
  reason?: string,
  ipAddress?: string
) {
  try {
    await createAuditTrail({
      userId: actingUserId,
      targetUserId,
      action,
      resourceType,
      resourceId,
      changes,
      reason,
      ipAddress,
    });
  } catch (error) {
    console.error("[Audit] Failed to create audit trail:", error);
  }
}

/**
 * Validate permission level
 */
export function isValidPermissionLevel(level: string): level is PermissionLevel {
  return ["view", "edit", "admin"].includes(level);
}

/**
 * Validate user role
 */
export function isValidUserRole(role: string): role is UserRole {
  return ["admin", "manager", "user"].includes(role);
}

/**
 * Get permission description in Arabic
 */
export function getPermissionDescription(permission: PermissionLevel): string {
  const descriptions: Record<PermissionLevel, string> = {
    view: "عرض فقط",
    edit: "تعديل",
    admin: "إدارة كاملة",
  };
  return descriptions[permission];
}

/**
 * Get role description in Arabic
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: "مسؤول النظام",
    manager: "مدير",
    user: "مستخدم عادي",
  };
  return descriptions[role];
}

/**
 * Check if user can perform an action and throw error if not
 */
export async function requirePermission(
  user: User,
  device: Device,
  requiredPermission: PermissionLevel = "view"
): Promise<void> {
  const hasPermission = await canAccessDevice(user, device, requiredPermission);

  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `ليس لديك صلاحيات كافية للوصول إلى هذا الجهاز. المطلوب: ${getPermissionDescription(requiredPermission)}`,
    });
  }
}

/**
 * Check if user is admin and throw error if not
 */
export function requireAdmin(user: User | null): asserts user is User {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  if (!isAdmin(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذه العملية متاحة فقط للمسؤولين",
    });
  }
}

/**
 * Check if user is manager or above and throw error if not
 */
export function requireManagerOrAbove(user: User | null): asserts user is User {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  if (!isManagerOrAbove(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذه العملية متاحة فقط للمديرين والمسؤولين",
    });
  }
}

/**
 * Permission matrix for different operations
 */
export const PERMISSION_MATRIX = {
  device: {
    view: ["admin", "manager", "user"],
    create: ["admin", "manager"],
    edit: ["admin", "manager"],
    delete: ["admin"],
    changeStatus: ["admin", "manager"],
    grantPermission: ["admin", "manager"],
  },
  user: {
    view: ["admin", "manager"],
    create: ["admin"],
    edit: ["admin"],
    delete: ["admin"],
    changeRole: ["admin"],
    deactivate: ["admin"],
  },
  alert: {
    view: ["admin", "manager", "user"],
    resolve: ["admin", "manager"],
    delete: ["admin"],
  },
  report: {
    view: ["admin", "manager", "user"],
    export: ["admin", "manager"],
    create: ["admin", "manager"],
    delete: ["admin"],
  },
  log: {
    view: ["admin", "manager"],
    export: ["admin", "manager"],
  },
} as const;

/**
 * Check if user role can perform an operation
 */
export function canPerformOperation(
  userRole: UserRole,
  resource: keyof typeof PERMISSION_MATRIX,
  operation: string
): boolean {
  const allowedRoles = (PERMISSION_MATRIX[resource] as any)[operation];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : false;
}
