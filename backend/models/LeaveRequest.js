import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const LeaveRequest = sequelize.define('LeaveRequest', {
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
  leaveTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'LeaveTypes',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  days: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  hrNotes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  attachments: {
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
  tableName: 'LeaveRequests',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'status', 'startDate'] },
    { fields: ['userId', 'workspaceId'] }
  ]
});

export default LeaveRequest;
