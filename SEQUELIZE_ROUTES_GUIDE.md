# Sequelize Routes Update Guide

This guide provides examples of how to update your routes from Mongoose to Sequelize syntax.

## Import Statements

### Before (Mongoose)
```javascript
import User from '../models/User.js';
import Task from '../models/Task.js';
```

### After (Sequelize)
```javascript
import { User, Task, Workspace, Team } from '../models/index.js';
```

## Common Query Patterns

### 1. Finding a Single Record by ID

**Before (Mongoose):**
```javascript
const user = await User.findById(userId);
if (!user) return res.status(404).json({ error: 'User not found' });
```

**After (Sequelize):**
```javascript
const user = await User.findByPk(userId);
if (!user) return res.status(404).json({ error: 'User not found' });
```

### 2. Finding Records with Conditions

**Before (Mongoose):**
```javascript
const users = await User.find({ role: 'admin', workspaceId: wsId });
const user = await User.findOne({ email: 'test@example.com' });
```

**After (Sequelize):**
```javascript
const users = await User.findAll({ where: { role: 'admin', workspaceId: wsId } });
const user = await User.findOne({ where: { email: 'test@example.com' } });
```

### 3. Creating a Record

**Before (Mongoose):**
```javascript
const user = await User.create({
  full_name: 'John Doe',
  email: 'john@example.com',
  password_hash: 'password123',
  role: 'member'
});
```

**After (Sequelize):**
```javascript
const user = await User.create({
  full_name: 'John Doe',
  email: 'john@example.com',
  password_hash: 'password123',
  role: 'member'
});
// No change - same syntax!
```

### 4. Updating a Record

**Before (Mongoose):**
```javascript
// Method 1
user.full_name = 'Jane Doe';
await user.save();

// Method 2
await User.findByIdAndUpdate(userId, { full_name: 'Jane Doe' });
```

**After (Sequelize):**
```javascript
// Method 1 - Same as before
user.full_name = 'Jane Doe';
await user.save();

// Method 2
await User.update({ full_name: 'Jane Doe' }, { where: { id: userId } });
```

### 5. Deleting a Record

**Before (Mongoose):**
```javascript
await User.findByIdAndDelete(userId);
await Task.deleteMany({ workspaceId: wsId });
```

**After (Sequelize):**
```javascript
await User.destroy({ where: { id: userId } });
await Task.destroy({ where: { workspaceId: wsId } });
```

### 6. Counting Records

**Before (Mongoose):**
```javascript
const count = await User.countDocuments({ workspaceId: wsId });
```

**After (Sequelize):**
```javascript
const count = await User.count({ where: { workspaceId: wsId } });
```

### 7. Sorting Results

**Before (Mongoose):**
```javascript
const users = await User.find({ role: 'member' }).sort({ created_at: -1 }).limit(10);
```

**After (Sequelize):**
```javascript
const users = await User.findAll({
  where: { role: 'member' },
  order: [['created_at', 'DESC']],
  limit: 10
});
```

### 8. Pagination

**Before (Mongoose):**
```javascript
const users = await User.find({ workspaceId: wsId })
  .skip((page - 1) * limit)
  .limit(limit);
```

**After (Sequelize):**
```javascript
const users = await User.findAll({
  where: { workspaceId: wsId },
  offset: (page - 1) * limit,
  limit: limit
});
```

### 9. Working with Relationships

**Before (Mongoose):**
```javascript
// Populate a reference
const task = await Task.findById(taskId).populate('creator').populate('assigned_to');
const team = await Team.findById(teamId).populate('members');
```

**After (Sequelize):**
```javascript
// Include related models
const task = await Task.findByPk(taskId, {
  include: ['creator', 'assigned_to']
});
const team = await Team.findByPk(teamId, {
  include: ['members']
});
```

### 10. Selecting Specific Fields

**Before (Mongoose):**
```javascript
const users = await User.find().select('full_name email role').limit(10);
```

**After (Sequelize):**
```javascript
const users = await User.findAll({
  attributes: ['full_name', 'email', 'role'],
  limit: 10
});
```

### 11. Filtering with Multiple Conditions

**Before (Mongoose):**
```javascript
const tasks = await Task.find({
  workspaceId: wsId,
  status: { $in: ['todo', 'in_progress'] },
  priority: 'high'
});
```

**After (Sequelize):**
```javascript
import { Op } from 'sequelize';

const tasks = await Task.findAll({
  where: {
    workspaceId: wsId,
    status: { [Op.in]: ['todo', 'in_progress'] },
    priority: 'high'
  }
});
```

### 12. Using Comparison Operators

**Before (Mongoose):**
```javascript
// Greater than
const tasks = await Task.find({ created_at: { $gt: date } });
// Less than
const tasks = await Task.find({ created_at: { $lt: date } });
// Not equal
const users = await User.find({ status: { $ne: 'INACTIVE' } });
```

**After (Sequelize):**
```javascript
import { Op } from 'sequelize';

// Greater than
const tasks = await Task.findAll({ where: { created_at: { [Op.gt]: date } } });
// Less than
const tasks = await Task.findAll({ where: { created_at: { [Op.lt]: date } } });
// Not equal
const users = await User.findAll({ where: { status: { [Op.ne]: 'INACTIVE' } } });
```

### 13. Using Transactions

**Before (Mongoose):**
```javascript
const session = await User.startSession();
await session.withTransaction(async () => {
  await User.create({ ... }, { session });
  await Task.create({ ... }, { session });
});
```

**After (Sequelize):**
```javascript
const transaction = await sequelize.transaction();
try {
  await User.create({ ... }, { transaction });
  await Task.create({ ... }, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 14. Using Hooks (After saving)

**Before (Mongoose):**
```javascript
userSchema.post('save', function() {
  console.log('User saved');
});
```

**After (Sequelize):**
```javascript
// In model definition
User.addHook('afterCreate', (user) => {
  console.log('User created');
});
```

## Common Operators

### Comparison Operators
```javascript
import { Op } from 'sequelize';

where: {
  // Equality
  age: 25,
  
  // Greater than
  age: { [Op.gt]: 18 },
  
  // Less than
  age: { [Op.lt]: 65 },
  
  // Greater than or equal
  age: { [Op.gte]: 18 },
  
  // Less than or equal
  age: { [Op.lte]: 65 },
  
  // Not equal
  status: { [Op.ne]: 'INACTIVE' },
  
  // In array
  status: { [Op.in]: ['ACTIVE', 'PENDING'] },
  
  // Not in array
  status: { [Op.notIn]: ['DELETED'] },
  
  // Like (contains)
  email: { [Op.like]: '%@example.com' },
  
  // Between
  age: { [Op.between]: [18, 65] },
  
  // AND
  [Op.and]: [
    { age: { [Op.gte]: 18 } },
    { status: 'ACTIVE' }
  ],
  
  // OR
  [Op.or]: [
    { role: 'admin' },
    { role: 'hr' }
  ]
}
```

## Error Handling

**Before (Mongoose):**
```javascript
try {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

**After (Sequelize):**
```javascript
try {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

## Batch Operations

**Before (Mongoose):**
```javascript
// Update many
await User.updateMany({ workspaceId: wsId }, { employmentStatus: 'ACTIVE' });

// Delete many
await Task.deleteMany({ status: 'archived' });
```

**After (Sequelize):**
```javascript
// Update many
await User.update({ employmentStatus: 'ACTIVE' }, { where: { workspaceId: wsId } });

// Delete many
await Task.destroy({ where: { status: 'archived' } });
```

## Find or Create Pattern

**Before (Mongoose):**
```javascript
let user = await User.findOne({ email });
if (!user) {
  user = await User.create({ email, full_name });
}
```

**After (Sequelize):**
```javascript
const [user, created] = await User.findOrCreate({
  where: { email },
  defaults: { full_name }
});
```

## Important Notes

1. **Always include `where` clause** - Sequelize requires explicit where conditions
2. **Use `findOrCreate`** - Much cleaner than manually checking and creating
3. **Import from `models/index.js`** - Ensures all associations are loaded
4. **Use transactions for complex operations** - Maintains data consistency
5. **Use `Op` operators** - Don't use MongoDB operators like `$gt`, `$in`
6. **Order syntax** - Sequelize uses arrays: `[['field', 'DESC']]`

## Testing Your Updates

After updating a route, test with:
```bash
curl -X GET http://localhost:5000/api/users
curl -X POST http://localhost:5000/api/users -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

Check server logs for SQL queries (logged in development):
```
Executing (default): SELECT * FROM "Users" WHERE ...
```
