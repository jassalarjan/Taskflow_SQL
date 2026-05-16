import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  blacklistTokenByValue,
  generateAccessToken,
  generateRefreshToken,
  isTokenBlacklisted,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const router = express.Router();

const tokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const serializeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const { password, ...safeUser } = plain;
  
  // System admin: admin users with no workspace
  const isSystemAdmin = safeUser.role === 'admin' && !safeUser.workspaceId && !safeUser.currentWorkspaceId;
  
  return {
    ...safeUser,
    id: safeUser.id,
    _id: safeUser.id,
    isSystemAdmin,
    workspace: null,
    workspaces: [],
  };
};

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', (_req, res) => {
  res.status(403).json({ message: 'Public registration is disabled.' });
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const rememberMe = Boolean(req.body.rememberMe);
    const sessionTimeout = Number(req.body.sessionTimeout || 24);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, null, rememberMe ? '30d' : `${Math.max(1, Math.min(sessionTimeout, 720))}h`);

    res.cookie('accessToken', accessToken, { ...tokenCookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...tokenCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return res.json({
      message: 'Login successful',
      user: serializeUser(user),
      workspace: null,
      workspaces: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || (decoded.jti && await isTokenBlacklisted(decoded.jti))) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    res.cookie('accessToken', accessToken, { ...tokenCookieOptions, maxAge: 60 * 60 * 1000 });

    return res.json({ message: 'Token refreshed' });
  } catch (error) {
    return res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (accessToken) {
      await blacklistTokenByValue(accessToken, 'access', 'logout');
    }
    if (refreshToken) {
      await blacklistTokenByValue(refreshToken, 'refresh', 'logout');
    }

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load profile', error: error.message });
  }
});

router.get('/my-workspaces', (_req, res) => {
  res.json({ workspaces: [] });
});

router.post('/switch-workspace', (_req, res) => {
  res.status(400).json({ message: 'Workspaces are disabled in this build.' });
});

export default router;
