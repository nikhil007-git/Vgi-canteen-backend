import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';


export const syncClerkUser = async (req, res, next) => {
  try {
    const { clerkId, email, name, phone } = req.body;

    if (!clerkId && !email) {
      return res.status(400).json({ success: false, message: "Invalid payload from Clerk" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || (cleanEmail ? cleanEmail.split("@")[0] : "Student")).trim();

    // 1. Try finding by clerkId first
    let user = null;
    if (clerkId) {
      user = await prisma.user.findFirst({
        where: { clerkId }
      });
    }

    // 2. If not found by clerkId, search by email
    if (!user && cleanEmail) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      // Link clerkId to existing user
      if (user && clerkId && !user.clerkId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId },
          select: { id: true, name: true, email: true, role: true, phone: true, clerkId: true }
        });
      }
    }

    // 3. If user does not exist, create in Neon DB
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail || `${clerkId}@vgi.ac.in`,
          clerkId: clerkId || null,
          role: "STUDENT",
          phone: phone || null
        },
        select: { id: true, name: true, email: true, role: true, phone: true, clerkId: true }
      });
    }

    // 4. Issue local token for full backward compatibility across all existing APIs
    const token = jwt.sign(
      { userId: user.id, role: user.role, clerkId: user.clerkId },
      process.env.JWT_SECRET || "vgi_canteen_jwt_secret_key_super_secure_2026",
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      message: "Clerk user synchronized successfully",
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'vgi_canteen_jwt_secret_key_super_secure_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginId = (identifier || username || email || '').trim().toLowerCase();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email and password.' });
    }

    // 1. Try finding by exact email
    let user = await prisma.user.findUnique({
      where: { email: loginId }
    });

    // 2. Try finding by name or email case-insensitive if not found
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginId },
            { name: loginId }
          ]
        }
      });
    }

    // 3. If typed without domain (e.g. "student"), try matching with "@vgi.ac.in"
    if (!user && !loginId.includes('@')) {
      user = await prisma.user.findFirst({
        where: { email: `${loginId}@vgi.ac.in` }
      });
    }

    // 4. Check if matches configured ADMIN_USERNAME from .env
    const envAdminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@vgi.ac.in').toLowerCase();
    if (!user && (loginId === envAdminUser || loginId === envAdminEmail || loginId === 'admin')) {
      user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'vgi_canteen_jwt_secret_key_super_secure_2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true
      }
    });

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const updateAdminCredentials = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { username, email, password } = req.body;

    const dataToUpdate = {};
    if (username && username.trim()) {
      dataToUpdate.username = username.trim().toLowerCase();
      dataToUpdate.name = username.trim();
    }
    if (email && email.trim()) {
      dataToUpdate.email = email.trim().toLowerCase();
    }
    if (password && password.trim()) {
      if (password.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
      }
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true
      }
    });

    res.json({
      success: true,
      message: 'Admin access credentials updated successfully! Use these new credentials for future logins.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
