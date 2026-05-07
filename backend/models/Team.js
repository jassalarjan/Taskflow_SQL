import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNotAdmin(value) {
        if (value.toLowerCase() === 'admin') {
          throw new Error('Team name "Admin" is reserved for super users only');
        }
      }
    }
  },
  hr_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Workspaces',
      key: 'id'
    },
    index: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Teams',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'name'] },
    { fields: ['workspaceId', 'lead_id'] }
  ]
});

export default Team;