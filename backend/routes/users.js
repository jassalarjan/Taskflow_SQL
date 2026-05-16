import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import User from '../models/User.js';

const router = express.Router();

const serializeUser = (user) => {
  const plain = typeof user?.toJSON === 'function' ? user.toJSON() : user;
  if (!plain) return null;
  const { password, ...safeUser } = plain;

  return {
    ...safeUser,
    _id: safeUser.id,
  };
};

const validateUser = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const { full_name, profile_picture } = req.body;
    await req.user.update({
      ...(full_name ? { full_name } : {}),
      ...(profile_picture !== undefined ? { profile_picture } : {}),
    });
    return res.json({ message: 'Profile updated', user: serializeUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

router.post('/me/profile-picture', authenticate, async (req, res) => {
  try {
    const { profile_picture } = req.body;
    await req.user.update({ profile_picture: profile_picture || null });
    return res.json({ message: 'Profile picture updated successfully', user: serializeUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile picture', error: error.message });
  }
});

router.delete('/me/profile-picture', authenticate, async (req, res) => {
  try {
    await req.user.update({ profile_picture: null });
    return res.json({ message: 'Profile picture removed successfully', user: serializeUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove profile picture', error: error.message });
  }
});

router.post('/me/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    const matches = await bcrypt.compare(oldPassword, req.user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    req.user.password = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

router.get('/', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (_req, res) => {
  const users = await User.findAll({ order: [['created_at', 'DESC']] });
  return res.json({ users: users.map(serializeUser), count: users.length });
});

router.get('/team-members', authenticate, async (_req, res) => {
  const users = await User.findAll({ order: [['created_at', 'DESC']] });
  return res.json({ users: users.map(serializeUser), count: users.length });
});

router.post('/', authenticate, checkRole(['admin', 'hr', 'community_admin']), validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, role = 'member', team_id = null } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const createdUser = await User.create({
      full_name,
      email: normalizedEmail,
      password: await bcrypt.hash(password || 'ChangeMe123!', 10),
      role,
      team_id,
    });

    return res.status(201).json({ message: 'User created', user: serializeUser(createdUser) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

router.put('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { full_name, email, role, team_id, profile_picture, employmentStatus } = req.body;
    await user.update({
      ...(full_name !== undefined ? { full_name } : {}),
      ...(email !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(team_id !== undefined ? { team_id } : {}),
      ...(profile_picture !== undefined ? { profile_picture } : {}),
      ...(employmentStatus !== undefined ? { employmentStatus } : {}),
    });

    return res.json({ message: 'User updated', user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

router.patch('/:id/password', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    return res.json({ message: 'Password updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

router.delete('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

router.post('/bulk-delete', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    await User.destroy({ where: { id: userIds } });
    return res.json({ message: 'Users deleted', deletedCount: userIds.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete users', error: error.message });
  }
});

router.post('/bulk-import/excel', authenticate, checkRole(['admin', 'hr', 'community_admin']), (_req, res) => {
  res.status(501).json({ message: 'Bulk import is not implemented in the SQL migration yet.' });
});

router.post('/bulk-import/json', authenticate, checkRole(['admin', 'hr', 'community_admin']), (_req, res) => {
  res.status(501).json({ message: 'Bulk import is not implemented in the SQL migration yet.' });
});

router.get('/bulk-import/template', authenticate, checkRole(['admin', 'hr', 'community_admin']), (_req, res) => {
  res.status(501).json({ message: 'Import templates are not implemented in the SQL migration yet.' });
});

router.get('/bulk-import/template-json', authenticate, checkRole(['admin', 'hr', 'community_admin']), (_req, res) => {
  res.status(501).json({ message: 'Import templates are not implemented in the SQL migration yet.' });
});

export default router;
