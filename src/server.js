import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import { getJwtSecret } from './middlewares/authMiddleware.js';

dotenv.config();

let currentPort = parseInt(process.env.PORT, 10) || 5001;
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const vercelDeployRegex = /^https:\/\/(www\.)?vgi-canteen[a-z0-9-]*\.vercel\.app$/;

// Socket.IO configuration with strict origin control
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || vercelDeployRegex.test(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Socket.IO origin blocked by CORS policy'), false);
    },
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

// Socket handshake authentication middleware
io.use(async (socket, next) => {
  try {
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (rawToken) {
      const token = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, name: true }
          });
          if (user) {
            socket.user = user;
          }
        }
      } catch (tokenErr) {
        // Invalid token attached, continue as unauthenticated guest
      }
    }
    next();
  } catch (err) {
    next();
  }
});

// Attach io to Express app so controllers can emit events
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins specific user room for order updates (Enforcing User Authorization)
  socket.on('join_user', (userId) => {
    if (!userId) return;
    const callerUser = socket.user;
    if (callerUser && (callerUser.id === userId || callerUser.role === 'ADMIN' || callerUser.role === 'STAFF')) {
      socket.join(`user_${userId}`);
    } else {
      console.warn(`[Security Alert] Unauthorized attempt to join user room: ${userId} by socket: ${socket.id}`);
    }
  });

  // Client joins admin room for kitchen notifications (Enforcing Admin/Staff Authorization)
  socket.on('join_admin', () => {
    const callerUser = socket.user;
    if (callerUser && (callerUser.role === 'ADMIN' || callerUser.role === 'STAFF')) {
      socket.join('admin_room');
    } else {
      console.warn(`[Security Alert] Unauthorized attempt to join admin room by socket: ${socket.id}`);
    }
  });

  // Client joins specific order tracking room
  socket.on('join_order', async (orderId) => {
    if (!orderId) return;
    const callerUser = socket.user;
    if (callerUser && (callerUser.role === 'ADMIN' || callerUser.role === 'STAFF')) {
      socket.join(`order_${orderId}`);
      return;
    }
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });
      if (order && callerUser && order.userId === callerUser.id) {
        socket.join(`order_${orderId}`);
      }
    } catch {
      // Ignore
    }
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});


const startServer = (port) => {
  server.listen(port, () => {
    console.log(`🚀 VGI Canteen Backend API listening on port ${port}`);
    console.log(`📡 Socket.io initialized on port ${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${currentPort} is currently occupied by another service.`);
    currentPort += 1;
    console.log(`🔄 Retrying backend on port ${currentPort}...`);
    startServer(currentPort);
  } else {
    console.error('Server startup error:', err);
  }
});

startServer(currentPort);
