import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('task_assigned', 'task_updated', 'task_completed', 'task_overdue', 'comment_added', 'status_changed', 'task_due'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  task_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  payload: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Workspaces',
      key: 'id'
    },
    index: true
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Notifications',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'user_id', 'read_at'] },
    { fields: ['workspaceId', 'created_at'] }
  ]
});

export default Notification;