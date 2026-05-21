const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatHandlers = require('./chatHandlers');
const callHandlers = require('./callHandlers');

// Map: userId -> socketId
const onlineUsers = new Map();

const setupSocket = (io, app) => {
  if (app) app.set('onlineUsers', onlineUsers);
  
  // Auth middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Update user status to online
    onlineUsers.set(socket.user._id.toString(), socket.id);
    await User.findByIdAndUpdate(socket.user._id, {
      status: 'online',
      socketId: socket.id,
    });

    // Send the current list of online users to the newly connected user
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    // Broadcast online status to all others (frontend expects the raw ID)
    socket.broadcast.emit('user_online', socket.user._id.toString());

    // Join user's own room for private notifications
    socket.join(socket.user._id.toString());

    // Register handlers
    chatHandlers(io, socket, onlineUsers);
    callHandlers(io, socket, onlineUsers);

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
      
      // Check if user has any other active sockets
      const sockets = await io.in(socket.user._id.toString()).fetchSockets();
      if (sockets.length === 0) {
        onlineUsers.delete(socket.user._id.toString());
        const lastSeen = new Date();
        await User.findByIdAndUpdate(socket.user._id, {
          status: 'offline',
          lastSeen,
          socketId: null,
        });
        io.emit('user_offline', socket.user._id.toString());
      }
    });
  });
};

module.exports = setupSocket;
module.exports.onlineUsers = {};
