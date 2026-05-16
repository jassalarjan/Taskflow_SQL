import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Workspace from './Workspace.js';
import Attendance from './Attendance.js';
import LeaveType from './LeaveType.js';
import LeaveRequest from './LeaveRequest.js';
import LeaveBalance from './LeaveBalance.js';
import Holiday from './Holiday.js';
import EmailTemplate from './EmailTemplate.js';
import EmailNotificationPreferences from './EmailNotificationPreferences.js';
import ScheduledEmailCampaign from './ScheduledEmailCampaign.js';
import Recipient from './Recipient.js';
import RevokedTokenModel from './RevokedToken.js';
import SecurityThrottleState from './SecurityThrottleState.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  full_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'hr', 'team_lead', 'member', 'community_admin'), defaultValue: 'member' },
  team_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  workspaceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  profile_picture: { type: DataTypes.TEXT, allowNull: true },
  employmentStatus: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_NOTICE', 'EXITED'), defaultValue: 'ACTIVE' },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const Team = sequelize.define('Team', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  hr_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  lead_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  priority: { type: DataTypes.INTEGER, defaultValue: 0 },
  workspaceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, {
  tableName: 'Teams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const Task = sequelize.define('Task', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done', 'archived'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  team_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'Tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  task_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  author_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'Comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  task_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: false },
  payload: { type: DataTypes.JSON, defaultValue: {} },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'Notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const ChangeLog = sequelize.define('ChangeLog', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  event_type: { type: DataTypes.STRING, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  user_email: { type: DataTypes.STRING, allowNull: true },
  user_name: { type: DataTypes.STRING, allowNull: true },
  user_role: { type: DataTypes.STRING, allowNull: true },
  user_ip: { type: DataTypes.STRING, allowNull: true },
  target_type: { type: DataTypes.STRING, allowNull: true },
  target_id: { type: DataTypes.STRING, allowNull: true },
  target_name: { type: DataTypes.STRING, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  metadata: { type: DataTypes.JSON, defaultValue: {} },
  changes: { type: DataTypes.JSON, defaultValue: {} },
  workspaceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, {
  tableName: 'ChangeLogs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Team.hasMany(User, { foreignKey: 'team_id', as: 'members' });

Team.belongsTo(User, { foreignKey: 'hr_id', as: 'hr' });
Team.belongsTo(User, { foreignKey: 'lead_id', as: 'lead' });
User.hasMany(Team, { foreignKey: 'hr_id', as: 'hrTeams' });
User.hasMany(Team, { foreignKey: 'lead_id', as: 'leadTeams' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Comment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
ChangeLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ChangeLog.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });
RevokedTokenModel.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Workspace.belongsTo(User, { foreignKey: 'owner', as: 'ownerUser' });

const syncModels = async () => {
  console.log('Model sync skipped - using existing tables');
};

export { 
  sequelize, 
  User, 
  Team, 
  Task, 
  Comment, 
  Notification, 
  ChangeLog, 
  RevokedTokenModel as RevokedToken, 
  Workspace, 
  Attendance,
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  Holiday,
  EmailTemplate,
  EmailNotificationPreferences,
  ScheduledEmailCampaign,
  Recipient,
  SecurityThrottleState,
  syncModels 
};