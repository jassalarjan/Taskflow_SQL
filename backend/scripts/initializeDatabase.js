import { sequelize, User, Workspace, Team, Task } from './models/index.js';

/**
 * Database Initialization Script
 * Run this once to set up the database with initial data
 * Usage: node scripts/initializeDatabase.js
 */

const initializeDatabase = async () => {
  try {
    console.log('🔧 Starting database initialization...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL database\n');

    // Sync all models
    console.log('📊 Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✓ All models synced\n');

    // Create default CORE workspace
    console.log('🏢 Creating default CORE workspace...');
    const [coreWorkspace, created] = await Workspace.findOrCreate({
      where: { type: 'CORE', isActive: true },
      defaults: {
        name: 'Core Workspace',
        type: 'CORE',
        settings: {
          allowPublicRegistration: false,
          sessionTimeout: 30,
          enableEmailNotifications: true,
          features: {
            bulkUserImport: true,
            auditLogs: true,
            advancedAutomation: true,
            customBranding: true
          }
        },
        limits: {
          maxUsers: null,
          maxTasks: null,
          maxTeams: null,
          maxStorageGB: null
        },
        usage: {
          userCount: 0,
          taskCount: 0,
          teamCount: 0
        }
      }
    });
    
    if (created) {
      console.log(`✓ Created CORE workspace: ${coreWorkspace.id}\n`);
    } else {
      console.log(`✓ CORE workspace already exists: ${coreWorkspace.id}\n`);
    }

    // Create default admin user (if needed)
    console.log('👤 Checking for default admin user...');
    const [admin, userCreated] = await User.findOrCreate({
      where: { email: 'admin@taskflow.local' },
      defaults: {
        full_name: 'System Administrator',
        email: 'admin@taskflow.local',
        password_hash: 'admin123', // Will be hashed by hook
        role: 'admin',
        employmentStatus: 'ACTIVE',
        workspaceId: coreWorkspace.id,
        currentWorkspaceId: coreWorkspace.id,
        isEmailVerified: true
      }
    });

    if (userCreated) {
      console.log(`✓ Created admin user: ${admin.email}\n`);
    } else {
      console.log(`✓ Admin user already exists: ${admin.email}\n`);
    }

    console.log('✅ Database initialization complete!\n');
    console.log('📝 Summary:');
    console.log(`   - Core Workspace ID: ${coreWorkspace.id}`);
    console.log(`   - Admin Email: ${admin.email}`);
    console.log(`   - Admin Password: admin123 (CHANGE THIS IN PRODUCTION)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:\n', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase();
