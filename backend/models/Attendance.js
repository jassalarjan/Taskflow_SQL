import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave', 'holiday'),
    defaultValue: 'absent'
  },
  workingHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isOverride: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  overrideBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
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
  tableName: 'Attendances',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['userId', 'date'], unique: true },
    { fields: ['workspaceId', 'date'] }
  ],
  hooks: {
    beforeCreate: calculateWorkingHours,
    beforeUpdate: calculateWorkingHours
  }
});

function calculateWorkingHours(attendance) {
  if (attendance.checkIn && attendance.checkOut) {
    const hours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
    attendance.workingHours = Math.round(hours * 100) / 100;
    
    if (!attendance.isOverride) {
      if (hours >= 8) {
        attendance.status = 'present';
      } else if (hours >= 4) {
        attendance.status = 'half_day';
      }
    }
  }
}

export default Attendance;
