import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Workspaces',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    uppercase: true
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
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('leave', 'attendance', 'system', 'custom', 'hiring', 'interview', 'onboarding', 'engagement', 'exit'),
    defaultValue: 'custom'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPredefined: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'EmailTemplates',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'code'] }
  ]
});

export default EmailTemplate;
