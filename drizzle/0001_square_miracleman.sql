CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actionType` enum('create','update','delete','status_change','permission_change','access','alert','other') NOT NULL,
	`description` text,
	`oldValue` json,
	`newValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`alertType` enum('disconnection','connection','status_change','unauthorized_access','maintenance_due','firmware_update','high_temperature','low_battery','custom') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`message` text NOT NULL,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetUserId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` int,
	`changes` json,
	`reason` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`metricName` varchar(100) NOT NULL,
	`metricValue` decimal(12,4) NOT NULL,
	`unit` varchar(50),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `device_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`userId` int NOT NULL,
	`permission` enum('view','edit','admin') NOT NULL,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `device_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_user_idx` UNIQUE(`deviceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `device_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `device_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`deviceTypeId` int NOT NULL,
	`status` enum('connected','disconnected','maintenance','inactive') NOT NULL DEFAULT 'disconnected',
	`location` varchar(255),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`ipAddress` varchar(45),
	`macAddress` varchar(17),
	`firmwareVersion` varchar(50),
	`serialNumber` varchar(100),
	`lastSeen` timestamp,
	`lastStatusChange` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`ownerId` int NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_deviceId_unique` UNIQUE(`deviceId`),
	CONSTRAINT `devices_serialNumber_unique` UNIQUE(`serialNumber`),
	CONSTRAINT `deviceId_idx` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `location_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`location` varchar(255),
	`accuracy` int,
	`speed` decimal(8,2),
	`heading` int,
	`altitude` decimal(10,2),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `location_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailOnAlert` boolean NOT NULL DEFAULT true,
	`emailOnStatusChange` boolean NOT NULL DEFAULT true,
	`emailOnPermissionChange` boolean NOT NULL DEFAULT false,
	`inAppNotifications` boolean NOT NULL DEFAULT true,
	`notificationFrequency` enum('immediate','hourly','daily','weekly') NOT NULL DEFAULT 'immediate',
	`quietHours` boolean NOT NULL DEFAULT false,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('alert','info','warning','success') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`sentVia` enum('in_app','email','sms') NOT NULL DEFAULT 'in_app',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('device_status','activity_log','alerts','custom') NOT NULL,
	`filters` json,
	`columns` json,
	`createdBy` int NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_trail` ADD CONSTRAINT `audit_trail_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_trail` ADD CONSTRAINT `audit_trail_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_metrics` ADD CONSTRAINT `device_metrics_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_permissions` ADD CONSTRAINT `device_permissions_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_permissions` ADD CONSTRAINT `device_permissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_permissions` ADD CONSTRAINT `device_permissions_grantedBy_users_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_deviceTypeId_device_types_id_fk` FOREIGN KEY (`deviceTypeId`) REFERENCES `device_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_history` ADD CONSTRAINT `location_history_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_alertId_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `alerts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_templates` ADD CONSTRAINT `report_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `device_idx` ON `activity_logs` (`deviceId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `activity_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `actionType_idx` ON `activity_logs` (`actionType`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `device_idx` ON `alerts` (`deviceId`);--> statement-breakpoint
CREATE INDEX `alertType_idx` ON `alerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `isResolved_idx` ON `alerts` (`isResolved`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `audit_trail` (`userId`);--> statement-breakpoint
CREATE INDEX `targetUser_idx` ON `audit_trail` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `audit_trail` (`createdAt`);--> statement-breakpoint
CREATE INDEX `device_idx` ON `device_metrics` (`deviceId`);--> statement-breakpoint
CREATE INDEX `metricName_idx` ON `device_metrics` (`metricName`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `device_metrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `device_idx` ON `device_permissions` (`deviceId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `device_permissions` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `devices` (`status`);--> statement-breakpoint
CREATE INDEX `deviceTypeId_idx` ON `devices` (`deviceTypeId`);--> statement-breakpoint
CREATE INDEX `ownerId_idx` ON `devices` (`ownerId`);--> statement-breakpoint
CREATE INDEX `createdBy_idx` ON `devices` (`createdBy`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `devices` (`location`);--> statement-breakpoint
CREATE INDEX `device_idx` ON `location_history` (`deviceId`);--> statement-breakpoint
CREATE INDEX `recordedAt_idx` ON `location_history` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `coordinates_idx` ON `location_history` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `alert_idx` ON `notifications` (`alertId`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `createdBy_idx` ON `report_templates` (`createdBy`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);