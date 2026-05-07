# Sequelize Quick Reference Card

## Quick Setup Checklist

- [ ] Ensure XAMPP MySQL is running on localhost:3306
- [ ] Create database: `CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- [ ] Update `.env` with MySQL credentials
- [ ] Run: `npm install` in backend folder
- [ ] Start server: `npm start` or `npm run dev`
- [ ] Check logs for "✓ MySQL connection established"

## Essential Imports

```javascript
import { sequelize, User, Task, Workspace, Team, /* ... other models */ } from '../models/index.js';
import { Op } from 'sequelize';  // For operators like Op.in, Op.gt, etc.
```

## Most Common Queries

### 1. GET All Records
```javascript
const users = await User.findAll({ 
  where: { workspaceId },
  order: [['created_at', 'DESC']],
  limit: 10
});
```

### 2. GET One Record
```javascript
const user = await User.findByPk(userId);
if (!user) return res.status(404).json({ error: 'Not found' });
```

### 3. CREATE Record
```javascript
const user = await User.create({
  full_name, email, password_hash, role
});
```

### 4. UPDATE Record
```javascript
await user.update({ full_name, email });
// or
await User.update({ status: 'ACTIVE' }, { where: { id: userId } });
```

### 5. DELETE Record
```javascript
await user.destroy();
// or
await User.destroy({ where: { id: userId } });
```

## Comparison Operators

| Operation | Mongoose | Sequelize |
|-----------|----------|-----------|
| Equals | `{ age: 25 }` | `{ age: 25 }` |
| > | `{ age: { $gt: 18 } }` | `{ age: { [Op.gt]: 18 } }` |
| < | `{ age: { $lt: 65 } }` | `{ age: { [Op.lt]: 65 } }` |
| >= | `{ age: { $gte: 18 } }` | `{ age: { [Op.gte]: 18 } }` |
| <= | `{ age: { $lte]: 65 } }` | `{ age: { [Op.lte]: 65 } }` |
| != | `{ age: { $ne: 30 } }` | `{ age: { [Op.ne]: 30 } }` |
| IN | `{ role: { $in: [...] } }` | `{ role: { [Op.in]: [...] } }` |
| LIKE | N/A | `{ email: { [Op.like]: '%@example%' } }` |

## Relationships

```javascript
// Include related data
const user = await User.findByPk(userId, {
  include: ['workspace', 'team']
});

// Get associated records
const tasks = await user.getTasks();
const team = await user.getTeam();
```

## Transactions (for multiple operations)

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

## Common Mistakes to Avoid

❌ `User.findById()` → ✅ `User.findByPk()`
❌ `User.find({ email })` → ✅ `User.findAll({ where: { email } })`
❌ `{ $gt: 18 }` → ✅ `{ [Op.gt]: 18 }`
❌ `sort({ date: -1 })` → ✅ `order: [['date', 'DESC']]`
❌ `.limit(10).skip(5)` → ✅ `.limit(10).offset(5)`

## Debugging Tips

### See Generated SQL
Add to `.env`:
```
NODE_ENV=development
```

Server will log all SQL queries:
```
Executing (default): SELECT * FROM Users WHERE ...
```

### Check Model Associations
```javascript
console.log(User.associations);  // Shows all associations
```

### Test Connection
```bash
mysql -h localhost -u root -p taskflow_db
SHOW TABLES;
DESCRIBE Users;
```

## Key Differences Summary

| Feature | Mongoose | Sequelize |
|---------|----------|-----------|
| Connection | `mongoose.connect()` | `sequelize.authenticate()` |
| Find by ID | `.findById(id)` | `.findByPk(id)` |
| Find One | `.findOne(query)` | `.findOne({ where })` |
| Find All | `.find(query)` | `.findAll({ where })` |
| Create | `.create()` | `.create()` |
| Update | `.update()` or `.save()` | `.update()` or `.save()` |
| Delete | `.deleteOne()/.deleteMany()` | `.destroy()` |
| Populate | `.populate()` | `.include()` |
| Sort | `.sort()` | `.order()` |
| Limit | `.limit()` | `.limit()` |
| Skip | `.skip()` | `.offset()` |
| Count | `.countDocuments()` | `.count()` |
| Transactions | `.startSession()` | `.transaction()` |

## File Locations

- **Config**: `backend/config/db.js`
- **Models**: `backend/models/` (18 files)
- **Models Index**: `backend/models/index.js` (associations)
- **Database Init**: `backend/scripts/initializeDatabase.js`
- **Guides**: Root folder (`MYSQL_MIGRATION_GUIDE.md`, `SEQUELIZE_ROUTES_GUIDE.md`)

## Next Steps

1. Update all route files to use Sequelize syntax
2. Test each endpoint individually
3. Test with different workspaces
4. Run database initialization script
5. Perform comprehensive testing

## Resources

- [Sequelize Docs](https://sequelize.org/)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [XAMPP Docs](https://www.apachefriends.org/)

---

**Last Updated**: May 6, 2026
**Status**: Model conversion complete ✅
