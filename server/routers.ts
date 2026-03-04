import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createDevice,
  getDeviceById,
  getDevicesByOwner,
  getDevicesByUser,
  updateDevice,
  updateDeviceStatus,
  deleteDevice,
  searchDevices,
  grantDevicePermission,
  getDevicePermissions,
  revokeDevicePermission,
  updateDevicePermission,
  createActivityLog,
  getActivityLogs,
  getActivityLogsByDevice,
  getAllUsers,
  updateUserRole,
  createAlert,
  getUnresolvedAlerts,
  resolveAlert,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getDeviceStatistics,
  getAlertStatistics,
  getAllDeviceTypes,
  createDeviceType,
  getAuditTrail,
  createAuditTrail,
  getUserById,
} from "./db";
import {
  isAdmin,
  isManagerOrAbove,
  requireAdmin,
  requireManagerOrAbove,
  canPerformOperation,
  auditPermissionChange,
  isValidPermissionLevel,
  isValidUserRole,
  canCreateDevices,
  canDeleteDevices,
  canModifyDevice,
  canAccessDevice as canAccessDevicePermission,
  canGrantPermission as canGrantDevicePermission,
} from "./permissions";

/**
 * Device Management Router
 */
const deviceRouter = router({
  // Get all devices accessible to the user
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Admin and managers see all devices
      if (isManagerOrAbove(user)) {
        return await getDevicesByOwner(user.id);
      }

      // Regular users see only their accessible devices
      return await getDevicesByUser(user.id);
    }),

  // Get device by ID with permission check
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const device = await getDeviceById(input.id);
    if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

    const hasAccess = await canAccessDevicePermission(user, device);
    if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات للوصول إلى هذا الجهاز" });

    return device;
  }),

  // Search devices
  search: protectedProcedure
    .input(z.object({ query: z.string(), status: z.enum(["connected", "disconnected", "maintenance", "inactive"]).optional() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      return await searchDevices(input.query, { status: input.status });
    }),

  // Create device
  create: protectedProcedure
    .input(
      z.object({
        deviceId: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        deviceTypeId: z.number(),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        ipAddress: z.string().optional(),
        macAddress: z.string().optional(),
        serialNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (!canCreateDevices(user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لإنشاء أجهزة" });
      }

      const deviceData = {
        ...input,
        ownerId: user.id,
        createdBy: user.id,
        status: "disconnected" as const,
        latitude: input.latitude ? String(input.latitude) : undefined,
        longitude: input.longitude ? String(input.longitude) : undefined,
      };
      const device = await createDevice(deviceData as any);

      // Log activity
      await createActivityLog({
        deviceId: device?.id,
        userId: user.id,
        action: "create",
        actionType: "create",
        description: `تم إنشاء جهاز جديد: ${input.name}`,
      });

      // Audit trail
      await auditPermissionChange(user.id, null, "create_device", "device", device?.id || null, { device: input });

      return device;
    }),

  // Update device
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        ipAddress: z.string().optional(),
        macAddress: z.string().optional(),
        firmwareVersion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const device = await getDeviceById(input.id);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

      if (!(await canModifyDevice(user, device))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لتعديل هذا الجهاز" });
      }

      const { id, ...updates } = input;
      const updateData = {
        ...updates,
        latitude: updates.latitude ? String(updates.latitude) : undefined,
        longitude: updates.longitude ? String(updates.longitude) : undefined,
      };
      const updatedDevice = await updateDevice(id, updateData as any);

      // Log activity
      await createActivityLog({
        deviceId: id,
        userId: user.id,
        action: "update",
        actionType: "update",
        description: `تم تحديث بيانات الجهاز`,
        oldValue: device,
        newValue: updatedDevice,
      });

      return updatedDevice;
    }),

  // Update device status
  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["connected", "disconnected", "maintenance", "inactive"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const device = await getDeviceById(input.id);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

      if (!(await canModifyDevice(user, device))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لتعديل حالة هذا الجهاز" });
      }

      const oldStatus = device.status;
      const updatedDevice = await updateDeviceStatus(input.id, input.status);

      // Log activity
      await createActivityLog({
        deviceId: input.id,
        userId: user.id,
        action: "status_change",
        actionType: "status_change",
        description: `تم تغيير حالة الجهاز من ${oldStatus} إلى ${input.status}`,
        oldValue: { status: oldStatus },
        newValue: { status: input.status },
      });

      // Create alert if disconnected
      if (input.status === "disconnected" && oldStatus !== "disconnected") {
        await createAlert({
          deviceId: input.id,
          alertType: "disconnection",
          severity: "high",
          message: `الجهاز ${device.name} قد تم قطع اتصاله`,
        });
      }

      return updatedDevice;
    }),

  // Delete device
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const device = await getDeviceById(input.id);
    if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

    if (!canDeleteDevices(user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لحذف الأجهزة" });
    }

    await deleteDevice(input.id);

    // Log activity
    await createActivityLog({
      deviceId: input.id,
      userId: user.id,
      action: "delete",
      actionType: "delete",
      description: `تم حذف الجهاز: ${device.name}`,
    });

    return { success: true };
  }),

  // Grant device permission
  grantPermission: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
        userId: z.number(),
        permission: z.enum(["view", "edit", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const device = await getDeviceById(input.deviceId);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

      if (!(await canGrantDevicePermission(user, device))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لمنح الصلاحيات على هذا الجهاز" });
      }

      const permission = await grantDevicePermission({
        deviceId: input.deviceId,
        userId: input.userId,
        permission: input.permission,
        grantedBy: user.id,
      });

      // Audit trail
      await auditPermissionChange(
        user.id,
        input.userId,
        "grant_permission",
        "device",
        input.deviceId,
        { permission: input.permission }
      );

      return permission;
    }),

  // Get device permissions
  getPermissions: protectedProcedure.input(z.object({ deviceId: z.number() })).query(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const device = await getDeviceById(input.deviceId);
    if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

    if (!(await canGrantDevicePermission(user, device))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لعرض صلاحيات هذا الجهاز" });
    }

    return await getDevicePermissions(input.deviceId);
  }),

  // Revoke device permission
  revokePermission: protectedProcedure.input(z.object({ permissionId: z.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    if (!isManagerOrAbove(user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لإلغاء الصلاحيات" });
    }

    await revokeDevicePermission(input.permissionId);
    return { success: true };
  }),
});

/**
 * User Management Router
 */
const userRouter = router({
  // Get all users (admin only)
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    requireAdmin(user);
    return await getAllUsers();
  }),

  // Get user by ID
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const targetUser = await getUserById(input.id);
    if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });

    // Users can only see their own info unless they're admin
    if (user.id !== input.id && !isAdmin(user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات لعرض بيانات هذا المستخدم" });
    }

    return targetUser;
  }),

  // Update user role (admin only)
  updateRole: protectedProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["admin", "manager", "user"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      requireAdmin(user);

      const updatedUser = await updateUserRole(input.userId, input.role);

      // Audit trail
      await auditPermissionChange(user.id, input.userId, "update_role", "user", input.userId, { role: input.role });

      return updatedUser;
    }),
});

/**
 * Activity Log Router
 */
const logRouter = router({
  // Get activity logs (manager and above)
  list: protectedProcedure
    .input(
      z.object({
        deviceId: z.number().optional(),
        userId: z.number().optional(),
        actionType: z.enum(["create", "update", "delete", "status_change", "permission_change", "access", "alert", "other"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      requireManagerOrAbove(user);

      return await getActivityLogs(
        {
          deviceId: input.deviceId,
          userId: input.userId,
          actionType: input.actionType,
          startDate: input.startDate,
          endDate: input.endDate,
        },
        input.limit,
        input.offset
      );
    }),

  // Get device activity logs
  getByDevice: protectedProcedure
    .input(z.object({ deviceId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const device = await getDeviceById(input.deviceId);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });

      if (!(await canAccessDevicePermission(user, device))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحيات للوصول إلى سجلات هذا الجهاز" });
      }

      return await getActivityLogsByDevice(input.deviceId, input.limit, input.offset);
    }),
});

/**
 * Alert Router
 */
const alertRouter = router({
  // Get unresolved alerts
  getUnresolved: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return await getUnresolvedAlerts();
  }),

  // Resolve alert
  resolve: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    requireManagerOrAbove(user);

    return await resolveAlert(input.alertId, user.id);
  }),
});

/**
 * Notification Router
 */
const notificationRouter = router({
  // Get user notifications
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      return await getUserNotifications(user.id, input.limit, input.offset);
    }),

  // Get unread notifications count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const unread = await getUnreadNotifications(user.id);
    return { count: unread.length };
  }),

  // Mark notification as read
  markAsRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return await markNotificationAsRead(input.notificationId);
  }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    await markAllNotificationsAsRead(user.id);
    return { success: true };
  }),
});

/**
 * Statistics Router
 */
const statsRouter = router({
  // Get device statistics
  devices: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return await getDeviceStatistics();
  }),

  // Get alert statistics
  alerts: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return await getAlertStatistics();
  }),
});

/**
 * Main App Router
 */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  device: deviceRouter,
  user: userRouter,
  log: logRouter,
  alert: alertRouter,
  notification: notificationRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
