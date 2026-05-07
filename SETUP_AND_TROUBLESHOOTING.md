# Quick Setup & Troubleshooting Guide

## ✅ What's Been Done

1. **Database Files Created:**
   - `taskflow_db.sql` - Complete MySQL schema with all tables, indexes, and seed data

2. **Backend Fixed:**
   - `Workspace.js` - Cleaned up, now pure Sequelize (removed MongoDB code)
   - `server.js` - Updated to import models/index.js for proper associations
   - `models/index.js` - All 18 models with associations configured

3. **Documentation Created:**
   - `FRONTEND_BACKEND_INTEGRATION.md` - Complete integration guide
   - API response format changes documented
   - All field mappings provided

---

## 🚀 Step-by-Step Setup

### Step 1: Create MySQL Database

**Option A: Using MySQL CLI**
```bash
mysql -h localhost -u root -p < taskflow_db.sql
```

**Option B: Using phpMyAdmin**
1. Open http://localhost/phpmyadmin
2. Click "Import" tab
3. Select `taskflow_db.sql` file
4. Click "Go"

**Option C: Manual Creation**
1. Open phpMyAdmin
2. Create database: `taskflow_db`
3. Character Set: `utf8mb4`
4. Collation: `utf8mb4_unicode_ci`
5. Then copy-paste SQL from taskflow_db.sql into SQL tab and execute

### Step 2: Verify XAMPP MySQL Running

```bash
# Check MySQL is running
mysql -h localhost -u root

# Should see MySQL prompt. Type:
USE taskflow_db;
SHOW TABLES;

# Should list all tables. Exit:
exit
```

### Step 3: Start Backend

```bash
cd backend
npm install  # Should complete quickly (already done)
npm run dev  # or: npm start
```

**Expected Output:**
```
✓ Database connection established
✓ Database models synced
Server running on port 5000
```

### Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v... ready in 123 ms
➜ Local: http://localhost:5173/
```

### Step 5: Test Login

1. Open http://localhost:5173
2. Click Login
3. Use credentials:
   - Email: `admin@taskflow.local`
   - Password: `admin123`

---

## 🔧 Troubleshooting

### Issue: "connect ECONNREFUSED 127.0.0.1:3306"

**Problem:** MySQL not running

**Solution:**
```bash
# XAMPP: Start MySQL from Control Panel
# OR via Command Line:
cd "C:\xampp\mysql\bin"
mysqld

# Verify it's running
mysql -h localhost -u root
```

### Issue: "Unknown database 'taskflow_db'"

**Problem:** Database not created

**Solution:**
```bash
# Create database
mysql -h localhost -u root -e "CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -h localhost -u root taskflow_db < taskflow_db.sql

# Verify
mysql -h localhost -u root taskflow_db -e "SHOW TABLES;"
```

### Issue: Frontend shows "Cannot read property 'id' of undefined"

**Problem:** API response format mismatch

**Solution:**
1. Check browser console (F12 → Console tab)
2. Look at Network tab → API request response
3. Verify response includes `id` field (not `_id`)
4. Update component to use correct field names

### Issue: Login fails with "Invalid credentials"

**Problem:** User not created or password hash wrong

**Solution:**
```bash
# Check if admin user exists
mysql -h localhost -u root taskflow_db -e "SELECT * FROM Users WHERE email='admin@taskflow.local';"

# If not found, insert it:
mysql -h localhost -u root taskflow_db -e "
INSERT INTO Users (id, full_name, email, password_hash, role, employmentStatus, workspaceId, currentWorkspaceId, isEmailVerified, createdAt)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'System Administrator',
  'admin@taskflow.local',
  '\$2a\$10\$aYYaXNms6nKA/.eVCR0T6uB7M8XmON2ZhOcqxVMiW3RJ.LgKdPxPe',
  'admin',
  'ACTIVE',
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  1,
  NOW()
) ON DUPLICATE KEY UPDATE email=email;
"
```

### Issue: Tasks not displaying (empty list)

**Problem:** API response format or missing relationships

**Solution:**
```javascript
// Check API response in Network tab
// Verify response has:
{
  "id": "uuid-format",
  "title": "Task Title",
  "due_date": "2026-05-15",
  "created_by": "user-uuid",
  "team_id": "team-uuid",
  "creator": { "id": "...", "full_name": "..." },  // nested object
  "team": { "id": "...", "name": "..." }
}
```

If missing nested objects, backend route needs `include` parameter:
```javascript
// backend/routes/tasks.js
Task.findAll({
  where: { workspaceId },
  include: ['creator', 'team']  // Add this
})
```

### Issue: Socket connection fails

**Problem:** VITE_SOCKET_URL incorrect

**Solution:** Check `.env.local` in frontend:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Restart frontend: `npm run dev`

---

## 📋 Database Schema Verification

Run these commands to verify database setup:

```bash
# Check all tables exist
mysql -h localhost -u root taskflow_db -e "SHOW TABLES;"

# Output should include:
# Attendances, ChangeLogs, Comments, Holidays, LeaveBalances, LeaveRequests
# LeaveTypes, Notifications, Recipients, RevokedTokens, ScheduledEmailCampaigns
# Tasks, Teams, Users, Workspaces, etc.

# Check CORE workspace exists
mysql -h localhost -u root taskflow_db -e "SELECT id, name, type FROM Workspaces;"

# Check admin user exists
mysql -h localhost -u root taskflow_db -e "SELECT id, full_name, email, role FROM Users;"

# Check leave types
mysql -h localhost -u root taskflow_db -e "SELECT id, name, code FROM LeaveTypes;"
```

---

## 🧪 API Testing Commands

After backend starts, test endpoints:

```bash
# 1. Login (get access token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.local","password":"admin123"}'

# Response will have cookies automatically set for next requests
# Copy the access token if needed

# 2. Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Cookie: accessToken=YOUR_TOKEN"

# 3. Get all workspaces
curl -X GET http://localhost:5000/api/workspaces \
  -H "Cookie: accessToken=YOUR_TOKEN"

# 4. Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Cookie: accessToken=YOUR_TOKEN"

# 5. Get all tasks
curl -X GET http://localhost:5000/api/tasks \
  -H "Cookie: accessToken=YOUR_TOKEN"

# 6. Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{
    "title": "Test Task",
    "description": "Testing task creation",
    "status": "todo",
    "priority": "high",
    "workspaceId": "c0000000-0000-0000-0000-000000000001"
  }'
```

---

## 📝 Important Notes

### Field Name Changes (MongoDB → MySQL)

| Old (MongoDB) | New (MySQL/Sequelize) | Example |
|---|---|---|
| `_id` | `id` | `task.id` |
| `dueDate` | `due_date` | `task.due_date` |
| `createdBy` | `created_by` | `task.created_by` |
| `teamId` | `team_id` | `team.id` |
| `_id` (in arrays) | `id` (in objects) | Relationships |

### UUID Format

All IDs are now UUID (36 characters):
```
Example: a1234567-89ab-cdef-0123-456789abcdef
NOT: 507f1f77bcf86cd799439011 (old ObjectId)
```

### Relationship Loading

To include related data in queries:
```javascript
// Backend code
Task.findAll({
  include: ['creator', 'team', 'workspace']
});

// Response includes nested objects:
{
  id: "...",
  title: "...",
  creator: { id: "...", full_name: "..." },
  team: { id: "...", name: "..." },
  workspace: { id: "...", name: "..." }
}
```

---

## ✅ Verification Checklist

- [ ] MySQL running and `taskflow_db` database exists
- [ ] All tables created (run `SHOW TABLES;` command)
- [ ] Admin user can login (admin@taskflow.local / admin123)
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Login redirects to dashboard
- [ ] Tasks display with correct field names (due_date, created_by)
- [ ] Creating new tasks works
- [ ] Real-time updates work (Socket.IO)
- [ ] API returns UUIDs (not ObjectIds)

---

## 📚 Key Files Reference

| File | Purpose |
|---|---|
| `taskflow_db.sql` | Database schema for MySQL import |
| `backend/models/Workspace.js` | Fixed Sequelize model |
| `backend/models/index.js` | Model associations |
| `backend/config/db.js` | Database connection config |
| `backend/server.js` | Main server entry point |
| `FRONTEND_BACKEND_INTEGRATION.md` | Complete integration guide |
| `.env` | Backend environment variables |
| `.env.local` | Frontend environment variables |

---

## 🎯 Next Steps After Setup

1. **Update All Route Files** (2-4 hour job):
   - Replace Mongoose query syntax with Sequelize
   - Use patterns from `FRONTEND_BACKEND_INTEGRATION.md`
   - Test each route after updating

2. **Update Frontend Components**:
   - Replace all `_id` references with `id`
   - Update field names (dueDate → due_date)
   - Test each component

3. **Run Full Test Suite**:
   - Login/Logout
   - Create/Read/Update/Delete (CRUD) operations
   - Real-time socket updates
   - Relationship loading (users, teams, tasks)

4. **Deploy to Production** (optional):
   - Use Render or Vercel
   - Update database connection strings
   - Set proper environment variables

---

## 🆘 Still Having Issues?

1. Check browser console (F12 → Console)
2. Check backend server logs (terminal output)
3. Check MySQL is running: `mysql -h localhost -u root`
4. Verify .env variables are correct
5. Check VITE environment variables in frontend
6. Review API responses in Network tab (F12 → Network)

All database schema, relationships, and seed data are in place. Once routes are updated to use Sequelize syntax, everything should work seamlessly!
