import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Recipient = sequelize.define('Recipient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    lowercase: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM('USER', 'EXTERNAL'),
    defaultValue: 'EXTERNAL'
  },
  linkedUserId: {
    type: DataTypes.UUID,
    allowNull: true,
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
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {
      phone: null,
      company: null,
      position: null,
      tags: []
    }
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      unsubscribe: false,
      categories: []
    }
  },
  emailCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastEmailSent: {
    type: DataTypes.DATE,
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
  tableName: 'Recipients',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['email', 'workspaceId'], unique: true },
    { fields: ['linkedUserId'] },
    { fields: ['source', 'workspaceId'] }
  ]
});

Recipient.prototype.canReceiveEmails = function() {
  return !this.preferences.unsubscribe;
};

export default Recipient;