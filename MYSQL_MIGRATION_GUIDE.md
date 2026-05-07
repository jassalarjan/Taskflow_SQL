# MongoDB to MySQL Migration Guide

## Overview
This document outlines the complete transformation of the Taskflow backend from MongoDB (Mongoose) to MySQL (Sequelize).

## What Changed

### Database Layer
- **ORM**: Mongoose → Sequelize
- **Database**: MongoDB Atlas → XAMPP MySQL (local)
- **Connection**: Environment variables updated for MySQL configuration

### Key Differences

#### 1. Connection Configuration
**Before (MongoDB):**
```javascript
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=TaskFlow
```

**After (MySQL):**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=taskflow_db
```

#### 2. Model Structure
**Before (Mongoose):**
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  // ... other fields
});
```

**After (Sequelize):**
```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  }
  // ... other fields
});
```

#### 3. Data Types Mapping
| Mongoose | Sequelize | MySQL |
|----------|-----------|-------|
| String | DataTypes.STRING | VARCHAR |
| Number | DataTypes.INTEGER/DECIMAL | INT/DECIMAL |
| Date | DataTypes.DATE | DATETIME |
| Boolean | DataTypes.BOOLEAN | TINYINT(1) |
| Object | DataTypes.JSON | JSON |
| Array | DataTypes.JSON | JSON |
| ObjectId | DataTypes.UUID | CHAR(36) |

### Models Converted
All 18 models have been converted from Mongoose to Sequelize:

1. ✅ Workspace
2. ✅ User
3. ✅ Team
4. ✅ Task
5. ✅ Comment
6. ✅ Notification
7. ✅ ChangeLog
8. ✅ Attendance
9. ✅ LeaveType
10. ✅ LeaveBalance
11. ✅ LeaveRequest
12. ✅ Holiday
13. ✅ EmailTemplate
14. ✅ Recipient
15. ✅ RevokedToken
16. ✅ SecurityThrottleState
17. ✅ ScheduledEmailCampaign
18. ✅ EmailNotificationPreferences

### Key Features Preserved
- All validations and constraints
- All indexes for query optimization
- All relationships and associations
- All hooks and pre/post processing logic
- Password hashing (bcrypt)
- Role-based access control
- Workspace isolation
- Timestamps (createdAt, updatedAt)

## Setup Instructions

### 1. Prerequisites
- XAMPP installed with MySQL running on port 3306
- Node.js 14+
- npm or yarn

### 2. Database Setup

#### Create MySQL Database
```sql
CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Connection Test
```bash
mysql -h localhost -u root -p taskflow_db
```

### 3. Environment Configuration
Update `.env` file in backend folder:
```env
PORT=5000

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_if_set
DB_NAME=taskflow_db

# Existing config (keep as is)
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Install Dependencies
```bash
cd backend
npm install
```

This installs:
- `sequelize` (6.35.2) - ORM
- `mysql2` (3.6.5) - MySQL driver

### 5. Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

**On first run**, Sequelize will:
1. Connect to MySQL
2. Create all tables automatically
3. Create all necessary indexes
4. Log confirmation messages

### 6. Verify Connection
When server starts, look for these logs:
```
✓ MySQL connection established successfully
✓ Database models synced
```

## Data Migration

### From MongoDB Atlas to XAMPP MySQL

If you have existing data in MongoDB that needs to be migrated:

#### Option 1: Export MongoDB Data
```bash
# Export collections to JSON
mongodump --uri "mongodb+srv://user:password@cluster.mongodb.net/taskflow" --out ./backup
```

#### Option 2: Use Migration Script (Coming Soon)
A migration script will be provided to:
- Export data from MongoDB
- Transform ObjectIds to UUIDs
- Insert into MySQL
- Validate data integrity

## Query Differences

### Finding Records

**Mongoose:**
```javascript
const user = await User.findById(id);
const users = await User.find({ role: 'admin' });
```

**Sequelize:**
```javascript
const user = await User.findByPk(id);
const users = await User.findAll({ where: { role: 'admin' } });
```

### Creating Records

**Mongoose:**
```javascript
const user = new User(data);
await user.save();
// or
const user = await User.create(data);
```

**Sequelize:**
```javascript
const user = await User.create(data);
```

### Updating Records

**Mongoose:**
```javascript
user.name = 'New Name';
await user.save();
// or
await User.findByIdAndUpdate(id, data);
```

**Sequelize:**
```javascript
await user.update(data);
// or
await User.update(data, { where: { id } });
```

### Deleting Records

**Mongoose:**
```javascript
await User.findByIdAndDelete(id);
```

**Sequelize:**
```javascript
await User.destroy({ where: { id } });
```

### Relationships/Associations

**Mongoose:**
```javascript
const user = await User.findById(id).populate('team_id');
```

**Sequelize:**
```javascript
const user = await User.findByPk(id, { include: ['team'] });
```

## Common Issues & Solutions

### Issue 1: "Cannot find module 'mongoose'"
**Solution**: Safe to ignore - Mongoose is no longer used. Remove any remaining imports.

### Issue 2: "Association not found"
**Solution**: Ensure `models/index.js` is imported in your routes/utilities to register associations:
```javascript
import './models/index.js';
```

### Issue 3: Decimal values causing issues with LeaveBalance
**Solution**: Sequelize uses DECIMAL(8,2) for leave days. Ensure you're passing numeric values.

### Issue 4: UUID vs Integer IDs
**Solution**: All IDs are now UUIDs. Update any hardcoded ID expectations.

## Performance Considerations

### Index Strategy
All workspace-specific queries now use compound indexes for better performance:
- `(workspaceId, status)` for task filtering
- `(workspaceId, date)` for attendance/holiday queries
- `(workspaceId, created_at)` for audit logs

### Query Optimization
Use Sequelize's query optimization:
```javascript
// Good - only select needed fields
User.findAll({ attributes: ['id', 'email', 'role'] });

// Good - use indexes
Task.findAll({ where: { workspaceId, status: 'todo' } });

// Avoid - full table scans
Task.findAll(); // without WHERE clause on workspaceId
```

## Rollback Plan

If you need to rollback to MongoDB:

1. Keep MongoDB Atlas connection active
2. Previous models are available in git history
3. To revert: `git checkout HEAD~N -- backend/models/`

## File Checklist

### Updated Files
- ✅ `package.json` - Dependencies updated
- ✅ `config/db.js` - MySQL connection
- ✅ `server.js` - Import statement updated
- ✅ `.env` - Database config updated
- ✅ `models/*.js` - All 18 models converted
- ✅ `models/index.js` - Created with associations

### Files That Need Review
- Routes (may need query syntax updates)
- Middleware (authentication, validation)
- Utilities (database helpers)
- Tests (if any)

## Next Steps

1. ✅ Database configuration complete
2. ✅ All models converted
3. ⏳ Update route handlers to use Sequelize queries
4. ⏳ Test all CRUD operations
5. ⏳ Test workspace isolation
6. ⏳ Test email functionality
7. ⏳ Load testing and optimization
8. ⏳ Data migration (if needed)

## Support Resources

- Sequelize Documentation: https://sequelize.org/
- MySQL Documentation: https://dev.mysql.com/doc/
- XAMPP Documentation: https://www.apachefriends.org/

## Questions?

For issues with the migration, check:
1. MySQL server is running
2. Database and tables are created
3. Environment variables are correct
4. Node modules are installed
5. No remaining Mongoose imports
