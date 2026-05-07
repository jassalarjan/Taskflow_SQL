import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const ChangeLog = sequelize.define('ChangeLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  event_type: {
    type: DataTypes.ENUM('user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted', 'user_bulk_deleted', 'task_created', 'task_updated', 'task_deleted', 'task_status_changed', 'task_assigned', 'task_unassigned', 'team_created', 'team_updated', 'team_deleted', 'team_bulk_deleted', 'team_member_added', 'team_member_removed', 'report_generated', 'automation_triggered', 'notification_sent', 'comment_added', 'comment_updated', 'comment_deleted', 'bulk_import', 'password_reset_request', 'password_reset', 'changelog_cleared', 'leave_cancelled', 'system_event'),
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  user_email: DataTypes.STRING,
  user_name: DataTypes.STRING,
  user_role: DataTypes.STRING,
  user_ip: DataTypes.STRING(45),
  target_type: {
    type: DataTypes.ENUM('task', 'user', 'team', 'report', 'comment', 'system', 'notification', 'automation', 'email'),
    allowNull: true
  },
  target_id: DataTypes.STRING,
  target_name: DataTypes.STRING,
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  changes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Workspaces',
      key: 'id'
    },
    index: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ChangeLogs',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['created_at'] },
    { fields: ['event_type'] },
    { fields: ['user_id'] },
    { fields: ['target_type', 'target_id'] },
    { fields: ['workspaceId', 'created_at'] },
    { fields: ['workspaceId', 'event_type'] }
  ]
});

export default ChangeLog;
