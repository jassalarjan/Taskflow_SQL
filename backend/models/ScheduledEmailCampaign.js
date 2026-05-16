import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const ScheduledEmailCampaign = sequelize.define('ScheduledEmailCampaign', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  workspaceId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Workspaces',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'EmailTemplates',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  recipients: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  scheduleType: {
    type: DataTypes.ENUM('once', 'recurring'),
    defaultValue: 'once'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  recurrence: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'processing', 'sent', 'failed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRecipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
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
  tableName: 'ScheduledEmailCampaigns',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'status'] },
    { fields: ['scheduledDate'] }
  ]
});

export default ScheduledEmailCampaign;