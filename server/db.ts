import { eq, and, or, desc, asc, gte, lte, like, inArray, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  devices,
  Device,
  InsertDevice,
  devicePermissions,
  DevicePermission,
  InsertDevicePermission,
  activityLogs,
  ActivityLog,
  InsertActivityLog,
  alerts,
  Alert,
  InsertAlert,
  notifications,
  Notification,
  InsertNotification,
  locationHistory,
  LocationHistory,
  InsertLocationHistory,
  deviceMetrics,
  DeviceMetric,
  InsertDeviceMetric,
  notificationPreferences,
  NotificationPreference,
  InsertNotificationPreference,
  deviceTypes,
  DeviceType,
  InsertDeviceType,
  auditTrail,
  AuditTrail,
  InsertAuditTrail,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "department", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "manager" | "user") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return await getUserById(userId);
}

/**
 * Device Management
 */
export async function createDevice(device: InsertDevice) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(devices).values(device);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getDeviceById(Number(insertId));
}

export async function getDeviceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDeviceByDeviceId(deviceId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDevicesByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(devices).where(eq(devices.ownerId, ownerId)).orderBy(desc(devices.createdAt));
}

export async function getDevicesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(devices)
    .innerJoin(devicePermissions, eq(devices.id, devicePermissions.deviceId))
    .where(eq(devicePermissions.userId, userId))
    .orderBy(desc(devices.createdAt));
}

export async function updateDevice(id: number, updates: Partial<Device>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(devices).set({ ...updates, updatedAt: new Date() }).where(eq(devices.id, id));
  return await getDeviceById(id);
}

export async function updateDeviceStatus(id: number, status: Device["status"]) {
  const db = await getDb();
  if (!db) return null;
  await db.update(devices).set({ status, lastStatusChange: new Date(), updatedAt: new Date() }).where(eq(devices.id, id));
  return await getDeviceById(id);
}

export async function deleteDevice(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(devices).where(eq(devices.id, id));
  return true;
}

export async function searchDevices(
  query: string,
  filters?: {
    status?: Device["status"];
    ownerId?: number;
    deviceTypeId?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [or(like(devices.name, `%${query}%`), like(devices.deviceId, `%${query}%`))];

  if (filters?.status) {
    conditions.push(eq(devices.status, filters.status));
  }
  if (filters?.ownerId) {
    conditions.push(eq(devices.ownerId, filters.ownerId));
  }
  if (filters?.deviceTypeId) {
    conditions.push(eq(devices.deviceTypeId, filters.deviceTypeId));
  }

  return await db.select().from(devices).where(and(...conditions)).orderBy(desc(devices.createdAt));
}

/**
 * Device Permissions
 */
export async function grantDevicePermission(permission: InsertDevicePermission) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(devicePermissions).values(permission);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getDevicePermissionById(Number(insertId));
}

export async function getDevicePermissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devicePermissions).where(eq(devicePermissions.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserDevicePermission(deviceId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(devicePermissions)
    .where(and(eq(devicePermissions.deviceId, deviceId), eq(devicePermissions.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDevicePermissions(deviceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(devicePermissions).where(eq(devicePermissions.deviceId, deviceId));
}

export async function revokeDevicePermission(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(devicePermissions).where(eq(devicePermissions.id, id));
  return true;
}

export async function updateDevicePermission(id: number, permission: "view" | "edit" | "admin") {
  const db = await getDb();
  if (!db) return null;
  await db.update(devicePermissions).set({ permission }).where(eq(devicePermissions.id, id));
  return await getDevicePermissionById(id);
}

/**
 * Activity Logs
 */
export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activityLogs).values(log);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getActivityLogById(Number(insertId));
}

export async function getActivityLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(activityLogs).where(eq(activityLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getActivityLogsByDevice(deviceId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.deviceId, deviceId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityLogsByUser(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityLogs(
  filters?: {
    deviceId?: number;
    userId?: number;
    actionType?: ActivityLog["actionType"];
    startDate?: Date;
    endDate?: Date;
  },
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.deviceId) conditions.push(eq(activityLogs.deviceId, filters.deviceId));
  if (filters?.userId) conditions.push(eq(activityLogs.userId, filters.userId));
  if (filters?.actionType) conditions.push(eq(activityLogs.actionType, filters.actionType));
  if (filters?.startDate) conditions.push(gte(activityLogs.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(activityLogs.createdAt, filters.endDate));

  return await db
    .select()
    .from(activityLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Alerts
 */
export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(alerts).values(alert);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getAlertById(Number(insertId));
}

export async function getAlertById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAlertsByDevice(deviceId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.deviceId, deviceId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnresolvedAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.isResolved, false))
    .orderBy(desc(alerts.severity), desc(alerts.createdAt))
    .limit(limit);
}

export async function resolveAlert(id: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(alerts).set({ isResolved: true, resolvedBy, resolvedAt: new Date() }).where(eq(alerts.id, id));
  return await getAlertById(id);
}

/**
 * Notifications
 */
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getNotificationById(Number(insertId));
}

export async function getNotificationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserNotifications(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
  return await getNotificationById(id);
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, userId));
  return true;
}

/**
 * Location History
 */
export async function recordLocationHistory(location: InsertLocationHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(locationHistory).values(location);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getLocationHistoryById(Number(insertId));
}

export async function getLocationHistoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(locationHistory).where(eq(locationHistory.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDeviceLocationHistory(deviceId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(locationHistory)
    .where(eq(locationHistory.deviceId, deviceId))
    .orderBy(desc(locationHistory.recordedAt))
    .limit(limit)
    .offset(offset);
}

export async function getDeviceLocationHistoryBetweenDates(deviceId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(locationHistory)
    .where(and(eq(locationHistory.deviceId, deviceId), gte(locationHistory.recordedAt, startDate), lte(locationHistory.recordedAt, endDate)))
    .orderBy(asc(locationHistory.recordedAt));
}

/**
 * Device Metrics
 */
export async function recordDeviceMetric(metric: InsertDeviceMetric) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deviceMetrics).values(metric);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getDeviceMetricById(Number(insertId));
}

export async function getDeviceMetricById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deviceMetrics).where(eq(deviceMetrics.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDeviceMetrics(deviceId: number, metricName?: string, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(deviceMetrics.deviceId, deviceId)];
  if (metricName) conditions.push(eq(deviceMetrics.metricName, metricName));

  return await db
    .select()
    .from(deviceMetrics)
    .where(and(...conditions))
    .orderBy(desc(deviceMetrics.timestamp))
    .limit(limit)
    .offset(offset);
}

/**
 * Notification Preferences
 */
export async function createNotificationPreferences(prefs: InsertNotificationPreference) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(notificationPreferences).values(prefs);
  return await getNotificationPreferencesByUserId(prefs.userId);
}

export async function getNotificationPreferencesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateNotificationPreferences(userId: number, updates: Partial<NotificationPreference>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(notificationPreferences).set({ ...updates, updatedAt: new Date() }).where(eq(notificationPreferences.userId, userId));
  return await getNotificationPreferencesByUserId(userId);
}

/**
 * Device Types
 */
export async function createDeviceType(type: InsertDeviceType) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deviceTypes).values(type);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getDeviceTypeById(Number(insertId));
}

export async function getDeviceTypeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deviceTypes).where(eq(deviceTypes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllDeviceTypes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deviceTypes).orderBy(asc(deviceTypes.name));
}

/**
 * Audit Trail
 */
export async function createAuditTrail(trail: InsertAuditTrail) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(auditTrail).values(trail);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return await getAuditTrailById(Number(insertId));
}

export async function getAuditTrailById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(auditTrail).where(eq(auditTrail.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAuditTrailByUser(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(auditTrail)
    .where(eq(auditTrail.userId, userId))
    .orderBy(desc(auditTrail.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAuditTrail(
  filters?: {
    userId?: number;
    targetUserId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.userId) conditions.push(eq(auditTrail.userId, filters.userId));
  if (filters?.targetUserId) conditions.push(eq(auditTrail.targetUserId, filters.targetUserId));
  if (filters?.action) conditions.push(like(auditTrail.action, `%${filters.action}%`));
  if (filters?.startDate) conditions.push(gte(auditTrail.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(auditTrail.createdAt, filters.endDate));

  return await db
    .select()
    .from(auditTrail)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditTrail.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Statistics & Analytics
 */
export async function getDeviceStatistics() {
  const db = await getDb();
  if (!db) return null;

  const totalDevices = await db.select().from(devices);
  const connectedDevices = await db.select().from(devices).where(eq(devices.status, "connected"));
  const disconnectedDevices = await db.select().from(devices).where(eq(devices.status, "disconnected"));
  const maintenanceDevices = await db.select().from(devices).where(eq(devices.status, "maintenance"));

  return {
    total: totalDevices.length,
    connected: connectedDevices.length,
    disconnected: disconnectedDevices.length,
    maintenance: maintenanceDevices.length,
  };
}

export async function getRecentActivityCount(hours = 24) {
  const db = await getDb();
  if (!db) return 0;

  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const result = await db.select().from(activityLogs).where(gte(activityLogs.createdAt, startDate));

  return result.length;
}

export async function getAlertStatistics() {
  const db = await getDb();
  if (!db) return null;

  const totalAlerts = await db.select().from(alerts);
  const unresolvedAlerts = await db.select().from(alerts).where(eq(alerts.isResolved, false));
  const criticalAlerts = await db.select().from(alerts).where(eq(alerts.severity, "critical"));

  return {
    total: totalAlerts.length,
    unresolved: unresolvedAlerts.length,
    critical: criticalAlerts.length,
  };
}
