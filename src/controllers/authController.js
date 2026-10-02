import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { getJwtSecret } from '../middlewares/authMiddleware.js';
import { isValidEmail, isValidPhone, sanitizeString } from '../middlewares/validate.js';

export const syncClerkUser = async (req, res, next) => {
  try {
    const { clerkId, email, name, phone } = req.body;

    if (!clerkId && !email) {
      return res.status(400).json({ success: false, message: "Invalid payload from Clerk: missing clerkId and email." });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = sanitizeString(name || (cleanEmail ? cleanEmail.split("@")[0] : "Student")).slice(0, 100);
    const cleanClerkId = clerkId ? sanitizeString(clerkId).slice(0, 128) : null;
    const cleanPhone = phone && isValidPhone(phone) ? phone.trim().replace(/\D/g, '').slice(0, 15) : null;

    // 1. Try finding by clerkId first
    let user = null;
    if (cleanClerkId) {
      user = await prisma.user.findFirst({
        where: { clerkId: cleanClerkId }
      });
    }

    // 2. If not found by clerkId, search by email
    if (!user && cleanEmail) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });
    }

    // SECURITY CHECK: Disallow synchronizing or logging in as ADMIN or STAFF via public sync endpoint
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
      console.warn(`[Security Alert] Blocked attempt to sync administrative account (${user.email}) via public Clerk endpoint`);
      return res.status(403).json({
        success: false,
        message: "Administrative accounts must authenticate directly via the Admin Portal."
      });
    }

    // 3. Link clerkId to existing student if not yet linked
    if (user && cleanClerkId && !user.clerkId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: cleanClerkId },
        select: { id: true, name: true, email: true, role: true, phone: true, clerkId: true }
      });
    }

    // 4. If user does not exist, create student record in DB
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: cleanName || "Student",
          email: cleanEmail || `${cleanClerkId}@vgi.ac.in`,
          clerkId: cleanClerkId,
          role: "STUDENT", // Strictly enforced
          phone: cleanPhone
        },
        select: { id: true, name: true, email: true, role: true, phone: true, clerkId: true }
      });
    }

    // 5. Issue local token with configured secret
    const token = jwt.sign(
      { userId: user.id, role: user.role, clerkId: user.clerkId },
      getJwtSecret(),
      { expiresIn: "7d" }
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
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanName = sanitizeString(name).slice(0, 100);
    if (cleanName.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password cannot exceed 128 characters.' });
    }

    let cleanPhone = null;
    if (phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-15 digit phone number.' });
      }
      cleanPhone = phone.trim().replace(/\D/g, '').slice(0, 15);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        phone: cleanPhone,
        role: 'STUDENT' // Prevent privilege escalation
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
      getJwtSecret(),
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
    const loginId = (identifier || username || email || '').trim().toLowerCase().slice(0, 254);

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email and password.' });
    }

    if (typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Invalid credentials format.' });
    }

    // 1. Try finding by exact email
    let user = await prisma.user.findUnique({
      where: { email: loginId }
    });

    // 2. Try finding by name or email if not found
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

    if (!user || !user.password) {
      // Dummy compare to mitigate timing enumeration
      await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Security Alert] Failed login attempt for identifier: ${loginId}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) {
      const cleanName = sanitizeString(name).slice(0, 100);
      if (cleanName.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      }
      dataToUpdate.name = cleanName;
    }

    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-15 digit phone number.' });
      }
      dataToUpdate.phone = phone ? phone.trim().replace(/\D/g, '').slice(0, 15) : null;
    }

    const user = await prisma.user.update({
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
    if (username && typeof username === 'string' && username.trim()) {
      dataToUpdate.name = sanitizeString(username).slice(0, 100);
    }
    if (email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid admin email address.' });
      }
      dataToUpdate.email = cleanEmail;
    }
    if (password && typeof password === 'string' && password.trim()) {
      if (password.trim().length < 8) {
        return res.status(400).json({ success: false, message: 'Admin password must be at least 8 characters long.' });
      }
      if (password.length > 128) {
        return res.status(400).json({ success: false, message: 'Password cannot exceed 128 characters.' });
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

    console.log(`[Security Audit] Admin credentials updated for user ID: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Admin access credentials updated successfully! Use these new credentials for future logins.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

