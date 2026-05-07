# Frontend-Backend Integration Guide (Mongoose → Sequelize)

## Overview
This guide ensures the React frontend properly communicates with the new Sequelize/MySQL backend. All API response formats have been updated to match Sequelize's output structure.

---

## Part 1: API Response Format Changes

### User Object Response

**Before (MongoDB/Mongoose):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "team_lead",
  "team": { "_id": "...", "name": "..." },
  "workspace": { "_id": "...", "name": "..." }
}
```

**After (MySQL/Sequelize):**
```json
{
  "id": "a1234567-89ab-cdef-0123-456789abcdef",
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "team_lead",
  "team_id": "b1234567-89ab-cdef-0123-456789abcdef",
  "team": {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "name": "Engineering"
  },
  "workspaceId": "c1234567-89ab-cdef-0123-456789abcdef",
  "currentWorkspaceId": "c1234567-89ab-cdef-0123-456789abcdef",
  "workspace": {
    "id": "c1234567-89ab-cdef-0123-456789abcdef",
    "name": "CORE"
  },
  "createdAt": "2026-05-06T10:30:00.000Z",
  "updatedAt": "2026-05-06T10:30:00.000Z"
}
```

**Key Changes:**
- `_id` → `id` (UUID format, not ObjectId)
- `team` → can have both `team_id` (FK) and nested `team` object (if include in query)
- Added `createdAt`, `updatedAt` timestamps automatically
- `workspaceId` instead of nested workspace object

### Task Object Response

**Before:**
```json
{
  "_id": "507f...",
  "title": "Design Landing Page",
  "status": "in_progress",
  "creator": { "_id": "...", "full_name": "..." },
  "team": { "_id": "...", "name": "..." },
  "dueDate": "2026-05-15"
}
```

**After:**
```json
{
  "id": "d1234567-89ab-cdef-0123-456789abcdef",
  "title": "Design Landing Page",
  "description": "Create modern landing page",
  "status": "in_progress",
  "priority": "high",
  "progress": 75,
  "created_by": "a1234567-89ab-cdef-0123-456789abcdef",
  "team_id": "b1234567-89ab-cdef-0123-456789abcdef",
  "workspaceId": "c1234567-89ab-cdef-0123-456789abcdef",
  "due_date": "2026-05-15",
  "createdAt": "2026-05-06T10:30:00.000Z",
  "updatedAt": "2026-05-06T10:30:00.000Z",
  "creator": {
    "id": "a1234567-89ab-cdef-0123-456789abcdef",
    "full_name": "John Doe"
  },
  "team": {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "name": "Engineering"
  }
}
```

**Key Changes:**
- `due_date` instead of `dueDate` (snake_case in DB, camelCase in response)
- `created_by` field for task creator
- `progress` field (0-100)
- `createdAt`, `updatedAt` auto-generated
- Relationships loaded via `include` parameter

---

## Part 2: Frontend Component Updates

### 1. Update Data Access Patterns

**File: `frontend/src/context/AuthContext.jsx`**

Current code is compatible. The context stores both `id` and relationships properly. No changes needed if backend provides full user objects.

### 2. Update Task Component References

**File: `frontend/src/components/TaskCard.jsx`**

```javascript
// OLD CODE (with MongoDB)
const taskCreator = task.creator?._id;
const teamId = task.team?._id;
const taskId = task._id;

// NEW CODE (with MySQL/Sequelize)
const taskCreator = task.creator?.id || task.created_by;
const teamId = task.team?.id || task.team_id;
const taskId = task.id;
```

### 3. Update Avatar Component

**File: `frontend/src/components/Avatar.jsx`**

Ensure it uses `user.id` instead of `user._id`:

```javascript
// OLD
const userId = user?._id;

// NEW
const userId = user?.id;
```

### 4. Update Navigation & Links

**File: `frontend/src/components/Navbar.jsx`**

```javascript
// OLD: Navigate using MongoDB ObjectId
onClick={() => navigate(`/tasks/${task._id}`)}

// NEW: Navigate using UUID
onClick={() => navigate(`/tasks/${task.id}`)}
```

---

## Part 3: API Call Updates

### Common Axios Patterns

**OLD (Mongoose) vs NEW (Sequelize)**

#### Get All Users
```javascript
// OLD
const response = await api.get('/users?workspace=' + workspaceId);

// NEW - Same endpoint, but response format changes
const response = await api.get('/users?workspaceId=' + workspaceId);
```

#### Get Single User
```javascript
// OLD
const response = await api.get(`/users/${userId}`);
// Response: { _id, email, team: {...}, ... }

// NEW
const response = await api.get(`/users/${userId}`);
// Response: { id, email, team_id, team: {...}, ... }
```

#### Create Task
```javascript
// OLD
const response = await api.post('/tasks', {
  title: 'New Task',
  status: 'todo',
  teamId: team._id
});

// NEW - Same request, IDs must be UUID format
const response = await api.post('/tasks', {
  title: 'New Task',
  status: 'todo',
  team_id: team.id,  // Note: snake_case in request
  workspaceId: workspace.id
});
```

#### Query with Includes
```javascript
// OLD (Mongoose populate)
const response = await api.get('/tasks/1?include=creator,team');
// Backend: Task.findById(id).populate('creator').populate('team')

// NEW (Sequelize include)
const response = await api.get('/tasks/1?include=creator,team');
// Backend: Task.findByPk(id, { include: ['creator', 'team'] })
```

---

## Part 4: Route Updates Needed in Backend

These patterns must be implemented in all route files:

### Authentication Routes (`backend/routes/auth.js`)

```javascript
// BEFORE (Mongoose)
const user = await User.findOne({ email }).populate('workspace');
return res.json({
  user: {
    _id: user._id,
    email: user.email,
    workspaceId: user.workspace?._id
  }
});

// AFTER (Sequelize)
const user = await User.findOne({ 
  where: { email },
  include: ['workspace']
});
return res.json({
  user: {
    id: user.id,
    email: user.email,
    workspaceId: user.workspaceId
  }
});
```

### User Routes (`backend/routes/users.js`)

```javascript
// BEFORE
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('team')
    .populate('workspace');
  res.json(user);
});

// AFTER
router.get('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: ['team', 'workspace']
  });
  res.json(user);
});
```

### Task Routes (`backend/routes/tasks.js`)

```javascript
// BEFORE
router.get('/', async (req, res) => {
  const tasks = await Task.find({ workspace: req.workspace._id })
    .populate('creator')
    .populate('team');
  res.json(tasks);
});

// AFTER
router.get('/', async (req, res) => {
  const tasks = await Task.findAll({
    where: { workspaceId: req.workspace.id },
    include: ['creator', 'team']
  });
  res.json(tasks);
});
```

---

## Part 5: Field Name Mapping

### Database → Frontend Mapping

| Database Field | Response Field | Frontend Uses | Type |
|---|---|---|---|
| `_id` | `id` | `user.id` | UUID |
| `full_name` | `full_name` | `user.full_name` | String |
| `email` | `email` | `user.email` | String |
| `team_id` | `team_id` | `task.team_id` | UUID FK |
| `workspaceId` | `workspaceId` | `user.workspaceId` | UUID FK |
| `due_date` | `due_date` | `task.due_date` | Date |
| `createdAt` | `createdAt` | `user.createdAt` | DateTime |
| `updatedAt` | `updatedAt` | `user.updatedAt` | DateTime |
| N/A | `team` (nested) | `task.team.name` | Object |
| N/A | `creator` (nested) | `task.creator.full_name` | Object |

---

## Part 6: Common Issues & Solutions

### Issue 1: "Cannot read property 'id' of undefined"
```javascript
// ❌ WRONG - doesn't check for nested object
const teamId = task.team?.id;  // Fails if team not included

// ✅ CORRECT - Check both FK and nested
const teamId = task.team?.id || task.team_id;
```

### Issue 2: Query Returns Empty Array
```javascript
// Problem: Frontend sends wrong parameter name
const users = await api.get('/users?team=' + teamId);  // ❌ Wrong

// Solution: Use correct parameter
const users = await api.get('/users?teamId=' + teamId);  // ✅ Correct
```

### Issue 3: Relationship Objects Not Included
```javascript
// Problem: Request doesn't include related data
const user = await api.get(`/users/${userId}`);
console.log(user.team);  // undefined ❌

// Solution: Backend must include relationships
// Backend code needed:
const user = await User.findByPk(userId, {
  include: ['team', 'workspace']  // ✅ This loads relationships
});
```

### Issue 4: Date Formatting Issues
```javascript
// Problem: Dates come as ISO strings
const date = new Date(task.due_date);  // May have timezone issues

// Solution: Use proper date library
import { format, parseISO } from 'date-fns';
const displayDate = format(parseISO(task.due_date), 'MMM dd, yyyy');
```

---

## Part 7: Testing Endpoints with cURL

After updating routes, test with these commands:

```bash
# Test user login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.local","password":"admin123"}'

# Test get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Test get all tasks
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Test create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Test Task",
    "status": "todo",
    "workspaceId": "c0000000-0000-0000-0000-000000000001"
  }'
```

---

## Part 8: Frontend Component Quick Fixes

### Update all occurrences of `_id` to `id`

In `frontend/src/pages/`:
- Dashboard.jsx: Replace `user._id` with `user.id`
- UserManagement.jsx: Replace `user._id` with `user.id`
- Teams.jsx: Replace `team._id` with `team.id`
- Tasks.jsx: Replace `task._id` with `task.id`

### Update camelCase field names to snake_case

- `due_date` instead of `dueDate`
- `created_by` instead of `createdBy`
- `team_id` instead of `teamId`
- `workspaceId` (already correct)

### Example Fix in TaskCard.jsx:
```javascript
// OLD
<span>{task.dueDate}</span>
<span>{task.createdBy}</span>

// NEW
<span>{task.due_date}</span>
<span>{task.created_by}</span>
```

---

## Part 9: Socket.IO Event Compatibility

Socket events should work as-is, but ensure they reference correct ID format:

```javascript
// Emit task update with UUID
socket.emit('task:updated', {
  taskId: task.id,  // UUID format
  workspaceId: workspace.id,
  updates: { status: 'done' }
});

// Listen for user joined
socket.on('user:joined', (data) => {
  console.log(data.userId);  // UUID format
});
```

---

## Part 10: Environment Variables

Ensure `.env.local` in frontend points to correct backend:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Verification Checklist

- [ ] Database created and SQL imported
- [ ] Backend server starts without errors
- [ ] Frontend loads without console errors
- [ ] Login endpoint returns user with `id` (UUID format)
- [ ] Tasks display with proper field names (`due_date`, `created_by`)
- [ ] Creating/updating resources works end-to-end
- [ ] Socket connections work (real-time updates)
- [ ] All relationships (teams, users, tasks) load correctly

---

## Summary

The key changes are:
1. **IDs**: MongoDB `_id` → MySQL `id` (UUID format)
2. **Relationships**: Use snake_case field names with optional nested objects
3. **API calls**: Same endpoints, response format changed
4. **Field names**: `dueDate` → `due_date`, etc.
5. **Query parameters**: Ensure backend routes updated to support Sequelize syntax

All frontend components should work once these mappings are applied consistently.
