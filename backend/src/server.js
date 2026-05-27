const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const setupSocket = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads (Fall back for local file uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/status', require('./routes/status'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/business', require('./routes/business'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'VipConnect server running ✅', timestamp: new Date() });
});

// Socket.io
const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
});

setupSocket(io, app);
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 VipConnect server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n`);
});

module.exports = { app, io };
