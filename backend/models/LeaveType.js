import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const LeaveType = sequelize.define('LeaveType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
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
    type: DataTypes.STRING(10),
    allowNull: false,
    uppercase: true
  },
  annualQuota: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  carryForward: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxCarryForward: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3b82f6'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
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
  tableName: 'LeaveTypes',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'code'], unique: true }
  ]
});

export default LeaveType;
