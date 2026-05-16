import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RevokedToken = sequelize.define('RevokedToken', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  jti: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  tokenType: {
    type: DataTypes.ENUM('access', 'refresh'),
    allowNull: false
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    index: true
  },
  reason: {
    type: DataTypes.STRING,
    defaultValue: 'revoked'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'RevokedTokens',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['expiresAt'] }
  ]
});

export default RevokedToken;
