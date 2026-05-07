import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const SecurityThrottleState = sequelize.define('SecurityThrottleState', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: true,
    index: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  blockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emails: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  suspiciousActivities: {
    type: DataTypes.JSON,
    defaultValue: []
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
  tableName: 'SecurityThrottleStates',
  timestamps: true,
  underscored: false
});

export default SecurityThrottleState;
