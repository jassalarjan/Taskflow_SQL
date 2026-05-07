import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    lowercase: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile_picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'hr', 'team_lead', 'member', 'community_admin'),
    defaultValue: 'member'
  },
  employmentStatus: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_NOTICE', 'EXITED'),
    defaultValue: 'ACTIVE'
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
  currentWorkspaceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Workspaces',
      key: 'id'
    }
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verificationTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpiry: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'Users',
  timestamps: true,
  underscored: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

User.prototype.getRoleInWorkspace = async function(workspaceId) {
  // For now, return the legacy role field
  // TODO: Implement workspace-specific roles via UserWorkspace junction table
  return this.role;
};

User.prototype.belongsToWorkspace = async function(workspaceId) {
  // TODO: Check against UserWorkspace junction table
  return this.workspaceId?.toString() === workspaceId?.toString() || this.role === 'admin';
};

User.prototype.addToWorkspace = async function(workspaceId, role) {
  this.workspaceId = workspaceId;
  this.currentWorkspaceId = workspaceId;
  this.role = role;
  await this.save();
};

User.prototype.removeFromWorkspace = async function(workspaceId) {
  if (this.workspaceId?.toString() === workspaceId?.toString()) {
    this.workspaceId = null;
    this.currentWorkspaceId = null;
    await this.save();
  }
};

User.prototype.switchWorkspace = async function(workspaceId) {
  if (!await this.belongsToWorkspace(workspaceId)) {
    throw new Error('User does not belong to this workspace');
  }
  this.currentWorkspaceId = workspaceId;
  await this.save();
};

export default User;