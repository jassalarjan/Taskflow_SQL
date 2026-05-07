import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done', 'archived'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  team_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Workspaces',
      key: 'id'
    },
    index: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
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
  tableName: 'Tasks',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['workspaceId', 'status'] },
    { fields: ['workspaceId', 'team_id'] },
    { fields: ['workspaceId', 'due_date'] }
  ]
});

export default Task;