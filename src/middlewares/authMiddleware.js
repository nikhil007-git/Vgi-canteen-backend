import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

let cachedSecret = null;
export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY CONFIGURATION: JWT_SECRET environment variable must be configured in production!');
  }

  if (!cachedSecret) {
    console.warn('⚠️ [SECURITY WARNING] JWT_SECRET is not configured in .env. Using development session secret.');
    cachedSecret = 'vgi_canteen_dev_jwt_secret_do_not_use_in_production_2026';
  }
  return cachedSecret;
};

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token payload.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, phone: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User session invalid or user no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
  }
  next();
};

export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
    return res.status(403).json({ success: false, message: 'Forbidden: Staff or Admin privileges required.' });
  }
  next();
};
