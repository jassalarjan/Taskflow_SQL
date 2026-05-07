import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const EmailNotificationPreferences = sequelize.define('EmailNotificationPreferences', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Workspaces',
      key: 'id'
    }
  },
  dueDateReminders: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      tomorrowReminders: true,
      todayReminders: true,
      overdueEscalation: true
    }
  },
  taskNotifications: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      assignmentNotifications: true,
      statusUpdateNotifications: true,
      commentNotifications: true
    }
  },
  adminReports: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      dailyReports: true,
      weeklyReports: true
    }
  },
  emailFrequency: {
    type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
    defaultValue: 'immediate'
  },
  quietHours: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'EmailNotificationPreferences',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['userId', 'workspaceId'], unique: true },
    { fields: ['workspaceId'] }
  ]
});

export default EmailNotificationPreferences;