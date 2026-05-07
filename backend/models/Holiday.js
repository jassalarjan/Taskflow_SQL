import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Holiday = sequelize.define('Holiday', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'Holidays',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'date'] }
  ]
});

export default Holiday;
