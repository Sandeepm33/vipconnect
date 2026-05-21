import { io } from 'socket.io-client';

let SOCKET_URL = 'http://localhost:5000';
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  // If we are on the tunnel, use the tunnel URL but we will proxy it. Wait, the proxy is failing.
  // We'll use the relative path for the tunnel, and absolute for localhost.
  SOCKET_URL = ''; 
}

let socket = null;

export const getSocket = () => socket;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, initSocket, disconnectSocket };
