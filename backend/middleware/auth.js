import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken || null;

    if (!token) return res.status(401).json({ message: 'Access token missing' });

    const decoded = verifyAccessToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid or expired token' });

    const user = await User.findByPk(decoded.userId, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Add _id for backward compatibility with frontend/other middleware
    user._id = user.id;
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
