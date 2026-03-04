import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  datetime,
  index,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["admin", "manager", "user"]).default("user").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    department: varchar("department", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Device types enumeration
 */
export const deviceTypes = mysqlTable("device_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeviceType = typeof deviceTypes.$inferSelect;
export type InsertDeviceType = typeof deviceTypes.$inferInsert;

/**
 * Main devices table for IoT device management
 */
export const devices = mysqlTable(
  "devices",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: varchar("deviceId", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    deviceTypeId: int("deviceTypeId").notNull(),
    status: mysqlEnum("status", ["connected", "disconnected", "maintenance", "inactive"]).default("disconnected").notNull(),
    location: varchar("location", { length: 255 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    ipAddress: varchar("ipAddress", { length: 45 }),
    macAddress: varchar("macAddress", { length: 17 }),
    firmwareVersion: varchar("firmwareVersion", { length: 50 }),
    serialNumber: varchar("serialNumber", { length: 100 }).unique(),
    lastSeen: timestamp("lastSeen"),
    lastStatusChange: timestamp("lastStatusChange").defaultNow().notNull(),
    metadata: json("metadata"),
    ownerId: int("ownerId").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    deviceIdIdx: uniqueIndex("deviceId_idx").on(table.deviceId),
    statusIdx: index("status_idx").on(table.status),
    deviceTypeIdx: index("deviceTypeId_idx").on(table.deviceTypeId),
    ownerIdx: index("ownerId_idx").on(table.ownerId),
    createdByIdx: index("createdBy_idx").on(table.createdBy),
    locationIdx: index("location_idx").on(table.location),
    fk_deviceType: foreignKey({
      columns: [table.deviceTypeId],
      foreignColumns: [deviceTypes.id],
    }),
    fk_owner: foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }),
    fk_createdBy: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Device access permissions - who can access which devices
 */
export const devicePermissions = mysqlTable(
  "device_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: int("deviceId").notNull(),
    userId: int("userId").notNull(),
    permission: mysqlEnum("permission", ["view", "edit", "admin"]).notNull(),
    grantedBy: int("grantedBy").notNull(),
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  (table) => ({
    deviceUserIdx: uniqueIndex("device_user_idx").on(table.deviceId, table.userId),
    deviceIdx: index("device_idx").on(table.deviceId),
    userIdx: index("user_idx").on(table.userId),
    fk_device: foreignKey({
      columns: [table.deviceId],
      foreignColumns: [devices.id],
    }),
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
    fk_grantedBy: foreignKey({
      columns: [table.grantedBy],
      foreignColumns: [users.id],
    }),
  })
);

export type DevicePermission = typeof devicePermissions.$inferSelect;
export type InsertDevicePermission = typeof devicePermissions.$inferInsert;

/**
 * Activity logs - comprehensive audit trail
 */
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: int("deviceId"),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    actionType: mysqlEnum("actionType", [
      "create",
      "update",
      "delete",
      "status_change",
      "permission_change",
      "access",
      "alert",
      "other",
    ]).notNull(),
    description: text("description"),
    oldValue: json("oldValue"),
    newValue: json("newValue"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    deviceIdx: index("device_idx").on(table.deviceId),
    userIdx: index("user_idx").on(table.userId),
    actionTypeIdx: index("actionType_idx").on(table.actionType),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    fk_device: foreignKey({
      columns: [table.deviceId],
      foreignColumns: [devices.id],
    }),
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Alerts and notifications configuration
 */
export const alerts = mysqlTable(
  "alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: int("deviceId").notNull(),
    alertType: mysqlEnum("alertType", [
      "disconnection",
      "connection",
      "status_change",
      "unauthorized_access",
      "maintenance_due",
      "firmware_update",
      "high_temperature",
      "low_battery",
      "custom",
    ]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
    message: text("message").notNull(),
    isResolved: boolean("isResolved").default(false).notNull(),
    resolvedBy: int("resolvedBy"),
    resolvedAt: timestamp("resolvedAt"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    deviceIdx: index("device_idx").on(table.deviceId),
    alertTypeIdx: index("alertType_idx").on(table.alertType),
    severityIdx: index("severity_idx").on(table.severity),
    isResolvedIdx: index("isResolved_idx").on(table.isResolved),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    fk_device: foreignKey({
      columns: [table.deviceId],
      foreignColumns: [devices.id],
    }),
    fk_resolvedBy: foreignKey({
      columns: [table.resolvedBy],
      foreignColumns: [users.id],
    }),
  })
);

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Notifications sent to users
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    alertId: int("alertId"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: mysqlEnum("type", ["alert", "info", "warning", "success"]).default("info").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    readAt: timestamp("readAt"),
    sentVia: mysqlEnum("sentVia", ["in_app", "email", "sms"]).default("in_app").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    alertIdx: index("alert_idx").on(table.alertId),
    isReadIdx: index("isRead_idx").on(table.isRead),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
    fk_alert: foreignKey({
      columns: [table.alertId],
      foreignColumns: [alerts.id],
    }),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Device location history for tracking movement
 */
export const locationHistory = mysqlTable(
  "location_history",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: int("deviceId").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    location: varchar("location", { length: 255 }),
    accuracy: int("accuracy"),
    speed: decimal("speed", { precision: 8, scale: 2 }),
    heading: int("heading"),
    altitude: decimal("altitude", { precision: 10, scale: 2 }),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    deviceIdx: index("device_idx").on(table.deviceId),
    recordedAtIdx: index("recordedAt_idx").on(table.recordedAt),
    coordinatesIdx: index("coordinates_idx").on(table.latitude, table.longitude),
    fk_device: foreignKey({
      columns: [table.deviceId],
      foreignColumns: [devices.id],
    }),
  })
);

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = typeof locationHistory.$inferInsert;

/**
 * Device metrics and telemetry data
 */
export const deviceMetrics = mysqlTable(
  "device_metrics",
  {
    id: int("id").autoincrement().primaryKey(),
    deviceId: int("deviceId").notNull(),
    metricName: varchar("metricName", { length: 100 }).notNull(),
    metricValue: decimal("metricValue", { precision: 12, scale: 4 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    deviceIdx: index("device_idx").on(table.deviceId),
    metricNameIdx: index("metricName_idx").on(table.metricName),
    timestampIdx: index("timestamp_idx").on(table.timestamp),
    fk_device: foreignKey({
      columns: [table.deviceId],
      foreignColumns: [devices.id],
    }),
  })
);

export type DeviceMetric = typeof deviceMetrics.$inferSelect;
export type InsertDeviceMetric = typeof deviceMetrics.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    emailOnAlert: boolean("emailOnAlert").default(true).notNull(),
    emailOnStatusChange: boolean("emailOnStatusChange").default(true).notNull(),
    emailOnPermissionChange: boolean("emailOnPermissionChange").default(false).notNull(),
    inAppNotifications: boolean("inAppNotifications").default(true).notNull(),
    notificationFrequency: mysqlEnum("notificationFrequency", ["immediate", "hourly", "daily", "weekly"]).default("immediate").notNull(),
    quietHours: boolean("quietHours").default(false).notNull(),
    quietHoursStart: varchar("quietHoursStart", { length: 5 }),
    quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Report templates for export
 */
export const reportTemplates = mysqlTable(
  "report_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["device_status", "activity_log", "alerts", "custom"]).notNull(),
    filters: json("filters"),
    columns: json("columns"),
    createdBy: int("createdBy").notNull(),
    isPublic: boolean("isPublic").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    createdByIdx: index("createdBy_idx").on(table.createdBy),
    fk_createdBy: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

/**
 * Audit trail for permission and role changes
 */
export const auditTrail = mysqlTable(
  "audit_trail",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    targetUserId: int("targetUserId"),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resourceType", { length: 50 }).notNull(),
    resourceId: int("resourceId"),
    changes: json("changes"),
    reason: text("reason"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    targetUserIdx: index("targetUser_idx").on(table.targetUserId),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
    fk_targetUser: foreignKey({
      columns: [table.targetUserId],
      foreignColumns: [users.id],
    }),
  })
);

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

/**
 * Relations for better query building
 */
export const usersRelations = relations(users, ({ many }) => ({
  devices: many(devices),
  permissions: many(devicePermissions),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  createdDevices: many(devices, { relationName: "createdBy" }),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  deviceType: one(deviceTypes, {
    fields: [devices.deviceTypeId],
    references: [deviceTypes.id],
  }),
  owner: one(users, {
    fields: [devices.ownerId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [devices.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  permissions: many(devicePermissions),
  activityLogs: many(activityLogs),
  alerts: many(alerts),
  locationHistory: many(locationHistory),
  metrics: many(deviceMetrics),
}));

export const devicePermissionsRelations = relations(devicePermissions, ({ one }) => ({
  device: one(devices, {
    fields: [devicePermissions.deviceId],
    references: [devices.id],
  }),
  user: one(users, {
    fields: [devicePermissions.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [devicePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  device: one(devices, {
    fields: [alerts.deviceId],
    references: [devices.id],
  }),
  resolvedByUser: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  alert: one(alerts, {
    fields: [notifications.alertId],
    references: [alerts.id],
  }),
}));

export const locationHistoryRelations = relations(locationHistory, ({ one }) => ({
  device: one(devices, {
    fields: [locationHistory.deviceId],
    references: [devices.id],
  }),
}));

export const deviceMetricsRelations = relations(deviceMetrics, ({ one }) => ({
  device: one(devices, {
    fields: [deviceMetrics.deviceId],
    references: [devices.id],
  }),
}));
