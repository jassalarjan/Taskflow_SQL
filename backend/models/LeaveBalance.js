import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  workspaceId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Workspaces',
      key: 'id'
    }
  },
  leaveTypeId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'LeaveTypes',
      key: 'id'
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalQuota: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  used: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  pending: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  available: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  carriedForward: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
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
  tableName: 'LeaveBalances',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['userId', 'leaveTypeId', 'year'], unique: true },
    { fields: ['workspaceId', 'year'] }
  ],
  hooks: {
    beforeCreate: (balance) => {
      balance.available = balance.totalQuota - balance.used - balance.pending;
    },
    beforeUpdate: (balance) => {
      balance.available = balance.totalQuota - balance.used - balance.pending;
    }
  }
});

LeaveBalance.prototype.recalculateTotalQuota = async function(annualQuota) {
  this.totalQuota = annualQuota + (this.carriedForward || 0);
  this.available = this.totalQuota - this.used - this.pending;
  return this;
};

LeaveBalance.applyCarryForward = async function(userId, leaveTypeId, fromYear, toYear, maxCarryForward) {
  const oldBalance = await this.findOne({ where: { userId, leaveTypeId, year: fromYear } });
  if (!oldBalance) return null;

  const availableToCarry = oldBalance.available;
  const actualCarryForward = maxCarryForward > 0 
    ? Math.min(availableToCarry, maxCarryForward) 
    : availableToCarry;

  let newBalance = await this.findOne({ where: { userId, leaveTypeId, year: toYear } });
  
  if (newBalance) {
    newBalance.carriedForward = actualCarryForward;
    await newBalance.save();
  }

  return newBalance;
};

export default LeaveBalance;
