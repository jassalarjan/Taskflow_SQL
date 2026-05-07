import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CORE', 'COMMUNITY'),
    defaultValue: 'COMMUNITY',
    allowNull: false
  },
  owner: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      allowPublicRegistration: false,
      sessionTimeout: 30,
      enableEmailNotifications: true,
      features: {
        bulkUserImport: false,
        auditLogs: false,
        advancedAutomation: false,
        customBranding: false
      }
    }
  },
  limits: {
    type: DataTypes.JSON,
    defaultValue: {
      maxUsers: null,
      maxTasks: null,
      maxTeams: null,
      maxStorageGB: null
    }
  },
  usage: {
    type: DataTypes.JSON,
    defaultValue: {
      userCount: 0,
      taskCount: 0,
      teamCount: 0
    }
  },
  subscription: {
    type: DataTypes.JSON,
    defaultValue: {
      planType: 'FREE'
    }
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
  tableName: 'Workspaces',
  timestamps: true,
  underscored: false,
  hooks: {
    beforeCreate: (workspace) => {
      setWorkspaceDefaults(workspace);
    },
    beforeUpdate: (workspace) => {
      setWorkspaceDefaults(workspace);
    }
  }
});

// Helper function to set defaults based on workspace type
const setWorkspaceDefaults = (workspace) => {
  if (workspace.type === 'CORE') {
    workspace.settings.features = {
      bulkUserImport: true,
      auditLogs: true,
      advancedAutomation: true,
      customBranding: true
    };
    workspace.limits = {
      maxUsers: null,
      maxTasks: null,
      maxTeams: null,
      maxStorageGB: null
    };
    workspace.subscription = { planType: 'ENTERPRISE' };
  } else if (workspace.type === 'COMMUNITY') {
    workspace.settings.features = {
      bulkUserImport: false,
      auditLogs: false,
      advancedAutomation: false,
      customBranding: false
    };
    workspace.limits = {
      maxUsers: 10,
      maxTasks: 100,
      maxTeams: 3,
      maxStorageGB: 1
    };
    workspace.subscription = { planType: 'FREE' };
  }
};

// Instance methods
Workspace.prototype.canAddUser = function() {
  if (this.type === 'CORE' || this.limits.maxUsers === null) {
    return true;
  }
  return this.usage.userCount < this.limits.maxUsers;
};

Workspace.prototype.canAddTask = function() {
  if (this.type === 'CORE' || this.limits.maxTasks === null) {
    return true;
  }
  return this.usage.taskCount < this.limits.maxTasks;
};

Workspace.prototype.canAddTeam = function() {
  if (this.type === 'CORE' || this.limits.maxTeams === null) {
    return true;
  }
  return this.usage.teamCount < this.limits.maxTeams;
};

Workspace.prototype.hasFeature = function(featureName) {
  return this.settings.features[featureName] === true;
};

Workspace.prototype.isCoreWorkspace = function() {
  return this.type === 'CORE';
};

Workspace.prototype.isCommunityWorkspace = function() {
  return this.type === 'COMMUNITY';
};

// Static methods
Workspace.getCoreWorkspace = async function() {
  return this.findOne({ where: { type: 'CORE', isActive: true } });
};

export default Workspace;
