import { sequelize } from '../config/db.js';
import Workspace from './Workspace.js';
import User from './User.js';
import Team from './Team.js';
import Task from './Task.js';
import Comment from './Comment.js';
import Notification from './Notification.js';
import ChangeLog from './ChangeLog.js';
import Attendance from './Attendance.js';
import LeaveType from './LeaveType.js';
import LeaveBalance from './LeaveBalance.js';
import LeaveRequest from './LeaveRequest.js';
import Holiday from './Holiday.js';
import EmailTemplate from './EmailTemplate.js';
import Recipient from './Recipient.js';
import RevokedToken from './RevokedToken.js';
import SecurityThrottleState from './SecurityThrottleState.js';
import ScheduledEmailCampaign from './ScheduledEmailCampaign.js';
import EmailNotificationPreferences from './EmailNotificationPreferences.js';

// ====== ASSOCIATIONS ======

// Workspace associations
Workspace.hasMany(User, { foreignKey: 'workspaceId', as: 'users' });
Workspace.hasMany(Team, { foreignKey: 'workspaceId', as: 'teams' });
Workspace.hasMany(Task, { foreignKey: 'workspaceId', as: 'tasks' });
Workspace.hasMany(LeaveType, { foreignKey: 'workspaceId', as: 'leaveTypes' });
Workspace.hasMany(Attendance, { foreignKey: 'workspaceId', as: 'attendances' });
Workspace.hasMany(Holiday, { foreignKey: 'workspaceId', as: 'holidays' });
Workspace.hasMany(LeaveBalance, { foreignKey: 'workspaceId', as: 'leaveBalances' });
Workspace.hasMany(LeaveRequest, { foreignKey: 'workspaceId', as: 'leaveRequests' });
Workspace.hasMany(Notification, { foreignKey: 'workspaceId', as: 'notifications' });
Workspace.hasMany(ChangeLog, { foreignKey: 'workspaceId', as: 'changeLogs' });
Workspace.hasMany(EmailTemplate, { foreignKey: 'workspaceId', as: 'emailTemplates' });
Workspace.hasMany(Recipient, { foreignKey: 'workspaceId', as: 'recipients' });
Workspace.hasMany(ScheduledEmailCampaign, { foreignKey: 'workspaceId', as: 'campaigns' });
Workspace.hasMany(EmailNotificationPreferences, { foreignKey: 'workspaceId', as: 'emailPrefs' });

// User associations
User.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
User.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments' });
User.hasMany(ChangeLog, { foreignKey: 'user_id', as: 'changeLogs' });
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
User.hasMany(LeaveBalance, { foreignKey: 'userId', as: 'leaveBalances' });
User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(EmailNotificationPreferences, { foreignKey: 'userId', as: 'emailPrefs' });
User.hasMany(ScheduledEmailCampaign, { foreignKey: 'createdBy', as: 'campaigns' });

// Team associations
Team.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
Team.belongsTo(User, { foreignKey: 'hr_id', as: 'hr' });
Team.belongsTo(User, { foreignKey: 'lead_id', as: 'lead' });
Team.hasMany(Task, { foreignKey: 'team_id', as: 'tasks' });

// Task associations
Task.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Task.hasMany(Comment, { foreignKey: 'task_id', as: 'comments' });
Task.hasMany(Notification, { foreignKey: 'task_id', as: 'notifications' });

// Comment associations
Comment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Notification associations
Notification.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// ChangeLog associations
ChangeLog.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
ChangeLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Attendance associations
Attendance.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Attendance.belongsTo(User, { foreignKey: 'overrideBy', as: 'overriddenBy' });

// LeaveType associations
LeaveType.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeaveType.hasMany(LeaveBalance, { foreignKey: 'leaveTypeId', as: 'balances' });
LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });

// LeaveBalance associations
LeaveBalance.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeaveBalance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// LeaveRequest associations
LeaveRequest.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });
LeaveRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Holiday associations
Holiday.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });

// EmailTemplate associations
EmailTemplate.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmailTemplate.hasMany(ScheduledEmailCampaign, { foreignKey: 'templateId', as: 'campaigns' });

// Recipient associations
Recipient.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
Recipient.belongsTo(User, { foreignKey: 'linkedUserId', as: 'linkedUser' });

// RevokedToken associations
RevokedToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ScheduledEmailCampaign associations
ScheduledEmailCampaign.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
ScheduledEmailCampaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ScheduledEmailCampaign.belongsTo(EmailTemplate, { foreignKey: 'templateId', as: 'template' });

// EmailNotificationPreferences associations
EmailNotificationPreferences.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
EmailNotificationPreferences.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export all models
export {
  sequelize,
  Workspace,
  User,
  Team,
  Task,
  Comment,
  Notification,
  ChangeLog,
  Attendance,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Holiday,
  EmailTemplate,
  Recipient,
  RevokedToken,
  SecurityThrottleState,
  ScheduledEmailCampaign,
  EmailNotificationPreferences
};
