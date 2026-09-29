import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

let currentPort = parseInt(process.env.PORT, 10) || 5001;
const server = http.createServer(app);

// Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Attach io to Express app so controllers can emit events
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins specific user room for order updates
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Client joins admin room for kitchen notifications
  socket.on('join_admin', () => {
    socket.join('admin_room');
  });

  // Client joins specific order tracking room
  socket.on('join_order', (orderId) => {
    if (orderId) {
      socket.join(`order_${orderId}`);
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
