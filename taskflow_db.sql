-- TaskFlow Database Schema
-- MySQL/XAMPP Compatible SQL Import
-- Generated: May 6, 2026

-- Create database
CREATE DATABASE IF NOT EXISTS taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskflow_db;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Workspaces
CREATE TABLE IF NOT EXISTS `Workspaces` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('CORE', 'COMMUNITY') NOT NULL DEFAULT 'COMMUNITY',
  `owner` CHAR(36),
  `settings` JSON DEFAULT NULL,
  `limits` JSON DEFAULT NULL,
  `usage` JSON DEFAULT NULL,
  `subscription` JSON DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_type_active` (`type`, `isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users
CREATE TABLE IF NOT EXISTS `Users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `profile_picture` LONGTEXT,
  `role` ENUM('admin', 'hr', 'team_lead', 'member', 'community_admin') DEFAULT 'member',
  `employmentStatus` ENUM('ACTIVE', 'INACTIVE', 'ON_NOTICE', 'EXITED') DEFAULT 'ACTIVE',
  `team_id` CHAR(36),
  `workspaceId` CHAR(36),
  `currentWorkspaceId` CHAR(36),
  `isEmailVerified` TINYINT(1) DEFAULT 0,
  `verificationToken` VARCHAR(255),
  `verificationTokenExpiry` DATETIME,
  `resetPasswordToken` VARCHAR(255),
  `resetPasswordExpiry` DATETIME,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_email` (`email`),
  KEY `idx_workspace` (`workspaceId`),
  KEY `idx_role` (`role`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teams
CREATE TABLE IF NOT EXISTS `Teams` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `name` VARCHAR(255) NOT NULL,
  `hr_id` CHAR(36) NOT NULL,
  `lead_id` CHAR(36) NOT NULL,
  `pinned` TINYINT(1) DEFAULT 0,
  `priority` INT DEFAULT 0,
  `workspaceId` CHAR(36) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_workspace_name` (`workspaceId`, `name`),
  KEY `idx_workspace_lead` (`workspaceId`, `lead_id`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hr_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`lead_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks
CREATE TABLE IF NOT EXISTS `Tasks` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('todo', 'in_progress', 'review', 'done', 'archived') DEFAULT 'todo',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `created_by` CHAR(36) NOT NULL,
  `team_id` CHAR(36),
  `workspaceId` CHAR(36),
  `due_date` DATE NOT NULL,
  `progress` INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_workspace_status` (`workspaceId`, `status`),
  KEY `idx_workspace_team` (`workspaceId`, `team_id`),
  KEY `idx_workspace_due_date` (`workspaceId`, `due_date`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`team_id`) REFERENCES `Teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments
CREATE TABLE IF NOT EXISTS `Comments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `task_id` CHAR(36) NOT NULL,
  `author_id` CHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `Tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS & AUDIT
-- ============================================================

-- Notifications
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `user_id` CHAR(36) NOT NULL,
  `type` ENUM('task_assigned', 'task_updated', 'task_completed', 'task_overdue', 'comment_added', 'status_changed', 'task_due') NOT NULL,
  `message` TEXT NOT NULL,
  `task_id` CHAR(36),
  `payload` JSON DEFAULT NULL,
  `workspaceId` CHAR(36) NOT NULL,
  `read_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_workspace_user_read` (`workspaceId`, `user_id`, `read_at`),
  KEY `idx_workspace_created` (`workspaceId`, `created_at`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`task_id`) REFERENCES `Tasks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ChangeLog (Audit Trail)
CREATE TABLE IF NOT EXISTS `ChangeLogs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `event_type` ENUM('user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted', 'user_bulk_deleted', 'task_created', 'task_updated', 'task_deleted', 'task_status_changed', 'task_assigned', 'task_unassigned', 'team_created', 'team_updated', 'team_deleted', 'team_bulk_deleted', 'team_member_added', 'team_member_removed', 'report_generated', 'automation_triggered', 'notification_sent', 'comment_added', 'comment_updated', 'comment_deleted', 'bulk_import', 'password_reset_request', 'password_reset', 'changelog_cleared', 'leave_cancelled', 'system_event') NOT NULL,
  `user_id` CHAR(36),
  `user_email` VARCHAR(255),
  `user_name` VARCHAR(255),
  `user_role` VARCHAR(50),
  `user_ip` VARCHAR(45),
  `target_type` ENUM('task', 'user', 'team', 'report', 'comment', 'system', 'notification', 'automation', 'email'),
  `target_id` VARCHAR(255),
  `target_name` VARCHAR(255),
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `changes` JSON DEFAULT NULL,
  `workspaceId` CHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_created_at` (`created_at`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_workspace_created` (`workspaceId`, `created_at`),
  KEY `idx_workspace_event` (`workspaceId`, `event_type`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HR MODULE TABLES
-- ============================================================

-- LeaveTypes
CREATE TABLE IF NOT EXISTS `LeaveTypes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `workspaceId` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `annualQuota` INT DEFAULT 12,
  `carryForward` TINYINT(1) DEFAULT 0,
  `maxCarryForward` INT DEFAULT 0,
  `color` VARCHAR(7) DEFAULT '#3b82f6',
  `isActive` TINYINT(1) DEFAULT 1,
  `description` TEXT,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_workspace_code` (`workspaceId`, `code`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance
CREATE TABLE IF NOT EXISTS `Attendances` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `userId` CHAR(36) NOT NULL,
  `workspaceId` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `checkIn` DATETIME,
  `checkOut` DATETIME,
  `status` ENUM('present', 'absent', 'half_day', 'leave', 'holiday') DEFAULT 'absent',
  `workingHours` DECIMAL(5, 2) DEFAULT 0,
  `notes` TEXT,
  `isOverride` TINYINT(1) DEFAULT 0,
  `overrideBy` CHAR(36),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_date` (`userId`, `date`),
  KEY `idx_workspace_date` (`workspaceId`, `date`),
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`overrideBy`) REFERENCES `Users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LeaveBalance
CREATE TABLE IF NOT EXISTS `LeaveBalances` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `userId` CHAR(36) NOT NULL,
  `workspaceId` CHAR(36) NOT NULL,
  `leaveTypeId` CHAR(36) NOT NULL,
  `year` INT NOT NULL,
  `totalQuota` DECIMAL(8, 2) NOT NULL,
  `used` DECIMAL(8, 2) DEFAULT 0,
  `pending` DECIMAL(8, 2) DEFAULT 0,
  `available` DECIMAL(8, 2) DEFAULT 0,
  `carriedForward` DECIMAL(8, 2) DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_leave_year` (`userId`, `leaveTypeId`, `year`),
  KEY `idx_workspace_year` (`workspaceId`, `year`),
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`leaveTypeId`) REFERENCES `LeaveTypes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LeaveRequests
CREATE TABLE IF NOT EXISTS `LeaveRequests` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `userId` CHAR(36) NOT NULL,
  `workspaceId` CHAR(36) NOT NULL,
  `leaveTypeId` CHAR(36) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `days` DECIMAL(8, 2) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  `approvedBy` CHAR(36),
  `approvedAt` DATETIME,
  `rejectionReason` TEXT,
  `hrNotes` TEXT,
  `attachments` JSON DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_workspace_status_date` (`workspaceId`, `status`, `startDate`),
  KEY `idx_user_workspace` (`userId`, `workspaceId`),
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`leaveTypeId`) REFERENCES `LeaveTypes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approvedBy`) REFERENCES `Users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Holidays
CREATE TABLE IF NOT EXISTS `Holidays` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `workspaceId` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `isRecurring` TINYINT(1) DEFAULT 0,
  `description` TEXT,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_workspace_date` (`workspaceId`, `date`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMAIL & COMMUNICATION TABLES
-- ============================================================

-- EmailTemplates
CREATE TABLE IF NOT EXISTS `EmailTemplates` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `workspaceId` CHAR(36),
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `subject` VARCHAR(255) NOT NULL,
  `htmlContent` LONGTEXT NOT NULL,
  `variables` JSON DEFAULT NULL,
  `category` ENUM('leave', 'attendance', 'system', 'custom', 'hiring', 'interview', 'onboarding', 'engagement', 'exit') DEFAULT 'custom',
  `isActive` TINYINT(1) DEFAULT 1,
  `isPredefined` TINYINT(1) DEFAULT 0,
  `senderName` VARCHAR(255),
  `senderEmail` VARCHAR(255),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_workspace_code` (`workspaceId`, `code`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipients
CREATE TABLE IF NOT EXISTS `Recipients` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `source` ENUM('USER', 'EXTERNAL') DEFAULT 'EXTERNAL',
  `linkedUserId` CHAR(36),
  `workspaceId` CHAR(36) NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `preferences` JSON DEFAULT NULL,
  `emailCount` INT DEFAULT 0,
  `lastEmailSent` DATETIME,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_email_workspace` (`email`, `workspaceId`),
  KEY `idx_linkedUser` (`linkedUserId`),
  KEY `idx_source_workspace` (`source`, `workspaceId`),
  FOREIGN KEY (`linkedUserId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ScheduledEmailCampaigns
CREATE TABLE IF NOT EXISTS `ScheduledEmailCampaigns` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `workspaceId` CHAR(36) NOT NULL,
  `createdBy` CHAR(36) NOT NULL,
  `templateId` CHAR(36) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `htmlContent` LONGTEXT NOT NULL,
  `variables` JSON DEFAULT NULL,
  `recipients` JSON DEFAULT NULL,
  `scheduleType` ENUM('once', 'recurring') DEFAULT 'once',
  `scheduledDate` DATETIME NOT NULL,
  `recurrence` JSON DEFAULT NULL,
  `status` ENUM('scheduled', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'scheduled',
  `sentAt` DATETIME,
  `sentCount` INT DEFAULT 0,
  `failedCount` INT DEFAULT 0,
  `totalRecipients` INT DEFAULT 0,
  `tags` JSON DEFAULT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_workspace_status` (`workspaceId`, `status`),
  KEY `idx_scheduled_date` (`scheduledDate`),
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `Users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`templateId`) REFERENCES `EmailTemplates`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- EmailNotificationPreferences
CREATE TABLE IF NOT EXISTS `EmailNotificationPreferences` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `userId` CHAR(36) NOT NULL,
  `workspaceId` CHAR(36) NOT NULL,
  `dueDateReminders` JSON DEFAULT NULL,
  `taskNotifications` JSON DEFAULT NULL,
  `adminReports` JSON DEFAULT NULL,
  `emailFrequency` ENUM('immediate', 'daily', 'weekly') DEFAULT 'immediate',
  `quietHours` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_workspace` (`userId`, `workspaceId`),
  KEY `idx_workspace` (`workspaceId`),
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workspaceId`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SECURITY TABLES
-- ============================================================

-- RevokedTokens
CREATE TABLE IF NOT EXISTS `RevokedTokens` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `jti` VARCHAR(255) NOT NULL UNIQUE,
  `tokenType` ENUM('access', 'refresh') NOT NULL,
  `userId` CHAR(36),
  `reason` VARCHAR(255) DEFAULT 'revoked',
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_expiry` (`expiresAt`),
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SecurityThrottleStates
CREATE TABLE IF NOT EXISTS `SecurityThrottleStates` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  `ip` VARCHAR(45) NOT NULL UNIQUE,
  `attempts` INT DEFAULT 0,
  `blockedUntil` DATETIME,
  `lastAttempt` DATETIME,
  `emails` JSON DEFAULT NULL,
  `suspiciousActivities` JSON DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default CORE workspace
INSERT INTO `Workspaces` (`id`, `name`, `type`, `settings`, `limits`, `usage`, `subscription`, `isActive`) 
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Core Workspace',
  'CORE',
  '{"allowPublicRegistration":false,"sessionTimeout":30,"enableEmailNotifications":true,"features":{"bulkUserImport":true,"auditLogs":true,"advancedAutomation":true,"customBranding":true}}',
  '{"maxUsers":null,"maxTasks":null,"maxTeams":null,"maxStorageGB":null}',
  '{"userCount":0,"taskCount":0,"teamCount":0}',
  '{"planType":"ENTERPRISE"}',
  1
) ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO `Users` (`id`, `full_name`, `email`, `password_hash`, `role`, `employmentStatus`, `workspaceId`, `currentWorkspaceId`, `isEmailVerified`, `createdAt`) 
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'System Administrator',
  'jassalarjansingh@gmail.com',
  '$2a$10$aYYaXNms6nKA/.eVCR0T6uB7M8XmON2ZhOcqxVMiW3RJ.LgKdPxPe',
  'admin',
  'ACTIVE',
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  1,
  NOW()
) ON DUPLICATE KEY UPDATE `email`=`email`;

-- Default leave types
INSERT INTO `LeaveTypes` (`id`, `workspaceId`, `name`, `code`, `annualQuota`, `carryForward`, `maxCarryForward`, `color`, `isActive`, `description`)
VALUES 
  ('00000001-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Casual Leave', 'CL', 12, 1, 5, '#3b82f6', 1, 'Casual leave for personal reasons'),
  ('00000002-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sick Leave', 'SL', 6, 0, 0, '#ef4444', 1, 'Sick leave for health reasons'),
  ('00000003-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Earned Leave', 'EL', 20, 1, 10, '#10b981', 1, 'Earned leave for completed service')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- ============================================================
-- INDEXES & CONSTRAINTS
-- ============================================================

-- Create indexes for better query performance
ALTER TABLE `Users` ADD INDEX `idx_email_workspace` (`email`, `workspaceId`);
ALTER TABLE `Users` ADD INDEX `idx_currentWorkspace` (`currentWorkspaceId`);
ALTER TABLE `Tasks` ADD INDEX `idx_created_by` (`created_by`);
ALTER TABLE `Tasks` ADD INDEX `idx_priority` (`priority`);

-- Create views for common queries
CREATE OR REPLACE VIEW `v_active_workspaces` AS
SELECT * FROM `Workspaces` WHERE `isActive` = 1;

CREATE OR REPLACE VIEW `v_active_users` AS
SELECT * FROM `Users` WHERE `employmentStatus` = 'ACTIVE';

CREATE OR REPLACE VIEW `v_pending_leaves` AS
SELECT * FROM `LeaveRequests` WHERE `status` = 'pending';

-- ============================================================
-- DONE
-- ============================================================
-- Database schema ready for TaskFlow
-- Run: source taskflow_db.sql from MySQL CLI
-- or import through phpMyAdmin
