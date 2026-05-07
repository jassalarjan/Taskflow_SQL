import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  task_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  author_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Comments',
  timestamps: false,
  underscored: false
});

export default Comment;