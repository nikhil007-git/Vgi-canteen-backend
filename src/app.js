import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { securityHeaders } from './middlewares/securityHeaders.js';
import { globalLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

const app = express();

// Trust reverse proxy (Render, Vercel, AWS ALB, Nginx) so req.ip is accurate
app.set('trust proxy', 1);

// Attach defensive security headers
app.use(securityHeaders);

// Allowed origins for CORS (Local development + Official Vercel deployment)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const vercelDeployRegex = /^https:\/\/(www\.)?vgi-canteen[a-z0-9-]*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || vercelDeployRegex.test(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
      return callback(null, true);
    }
    console.warn(`[Security Alert] Blocked unauthorized CORS origin: ${origin}`);
    return callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-request-id']
}));

// Apply global rate limiter across all endpoints
app.use(globalLimiter);

// Parse JSON bodies with size limit (1MB) and capture raw body for HMAC signature verification
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VGI Canteen API',
    timestamp: new Date().toISOString()
  });
});

// API Routes (Mounted under both /api/* and /* for full compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/menu', menuRoutes);
app.use('/menu', menuRoutes);

app.use('/api/coupons', couponRoutes);
app.use('/coupons', couponRoutes);

app.use('/api/canteen', canteenRoutes);
app.use('/canteen', canteenRoutes);

app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;

