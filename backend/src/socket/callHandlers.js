const { v4: uuidv4 } = require('uuid');
const Call = require('../models/Call');
const Chat = require('../models/Chat');

// Active call rooms: roomId -> { participants: Set(socketId), callDoc }
const activeRooms = new Map();

const callHandlers = (io, socket, onlineUsers) => {
  // Initiate a call
  socket.on('call_initiate', async ({ chatId, type, isGroup }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, members: socket.user._id })
        .populate('members', 'name avatar');

      if (!chat) return;

      const roomId = uuidv4();

      const participantDocs = chat.members.map((m) => ({
        user: m._id,
        status: m._id.toString() === socket.user._id.toString() ? 'accepted' : 'invited',
      }));

      const callDoc = await Call.create({
        chat: chatId,
        initiator: socket.user._id,
        participants: participantDocs,
        type,
        isGroup: isGroup || chat.isGroup,
        status: 'ringing',
        roomId,
      });

      // Join initiator to call room
      socket.join(`call:${roomId}`);

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          participants: new Set([socket.id]),
          callDoc,
        });
      }

      // Notify all other members
      chat.members.forEach((member) => {
        const memberIdStr = member._id.toString();
        if (memberIdStr !== socket.user._id.toString()) {
          io.to(memberIdStr).emit('call_incoming', {
            callId: callDoc._id,
            roomId,
            type,
            isGroup: isGroup || chat.isGroup,
            initiator: {
              _id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar,
            },
            chat: {
              _id: chat._id,
              name: chat.isGroup ? chat.name : socket.user.name,
              isGroup: chat.isGroup,
            },
          });
        }
      });

      socket.emit('call_created', { callId: callDoc._id, roomId });
    } catch (err) {
      console.error('call_initiate error:', err);
      socket.emit('call_error', { error: err.message });
    }
  });

  // Accept call
  socket.on('call_accept', async ({ callId, roomId }) => {
    try {
      // Update call status and add participant only if not already added
      const call = await Call.findById(callId);
      if (!call) return;

      const alreadyIn = call.participants.some(
        (p) => p.user.toString() === socket.user._id.toString()
      );

      const updateQuery = {
        $set: { status: 'ongoing', startedAt: call.startedAt || new Date() },
      };
      if (!alreadyIn) {
        updateQuery.$push = { participants: { user: socket.user._id, status: 'accepted', joinedAt: new Date() } };
      }

      await Call.findByIdAndUpdate(callId, updateQuery, { new: true });

      socket.join(`call:${roomId}`);

      const room = activeRooms.get(roomId);
      if (room) {
        room.participants.add(socket.id);
      } else {
        activeRooms.set(roomId, { participants: new Set([socket.id]) });
      }

      // Get existing participants in the room (for WebRTC mesh)
      // Shape must match what frontend expects: { socketId, user: { _id, name, avatar } }
      const existingParticipants = [];
      const roomSockets = await io.in(`call:${roomId}`).fetchSockets();
      roomSockets.forEach((s) => {
        if (s.id !== socket.id && s.user) {
          existingParticipants.push({
            socketId: s.id,
            user: {
              _id: s.user._id,
              name: s.user.name,
              avatar: s.user.avatar,
            },
          });
        }
      });

      // Tell the new participant about existing ones
      socket.emit('call_participants', { roomId, participants: existingParticipants });

      // Tell existing participants a new one joined
      socket.to(`call:${roomId}`).emit('participant_joined', {
        roomId,
        socketId: socket.id,
        user: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
      });
    } catch (err) {
      console.error('call_accept error:', err);
    }
  });

  // Reject call
  socket.on('call_reject', async ({ callId, roomId }) => {
    try {
      await Call.findByIdAndUpdate(callId, {
        status: 'rejected',
        endedAt: new Date(),
      });

      io.to(`call:${roomId}`).emit('call_rejected', {
        roomId,
        userId: socket.user._id,
        name: socket.user.name,
      });
    } catch (err) {
      console.error('call_reject error:', err);
    }
  });

  // End call
  socket.on('call_end', async ({ callId, roomId }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      const duration = call.startedAt
        ? Math.floor((new Date() - call.startedAt) / 1000)
        : 0;

      await Call.findByIdAndUpdate(callId, {
        status: 'completed',
        endedAt: new Date(),
        duration,
      });

      io.to(`call:${roomId}`).emit('call_ended', { roomId, callId });
      io.socketsLeave(`call:${roomId}`);
      activeRooms.delete(roomId);
    } catch (err) {
      console.error('call_end error:', err);
    }
  });

  // WebRTC Signaling
  // Send SDP offer to a specific peer
  socket.on('webrtc_offer', ({ targetSocketId, offer, roomId }) => {
    io.to(targetSocketId).emit('webrtc_offer', {
      offer,
      fromSocketId: socket.id,
      fromUser: {
        _id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
      roomId,
    });
  });

  // Send SDP answer back to a specific peer
  socket.on('webrtc_answer', ({ targetSocketId, answer, roomId }) => {
    io.to(targetSocketId).emit('webrtc_answer', {
      answer,
      fromSocketId: socket.id,
      roomId,
    });
  });

  // Send ICE candidate to a specific peer
  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate, roomId }) => {
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      candidate,
      fromSocketId: socket.id,
      roomId,
    });
  });

  // Media state changes
  socket.on('media_state_change', ({ roomId, video, audio }) => {
    socket.to(`call:${roomId}`).emit('participant_media_changed', {
      socketId: socket.id,
      userId: socket.user._id,
      video,
      audio,
    });
  });

  // Handle disconnect during call
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      if (room.startsWith('call:')) {
        const roomId = room.replace('call:', '');
        socket.to(room).emit('participant_left', {
          socketId: socket.id,
          userId: socket.user._id,
          name: socket.user.name,
        });
        const activeRoom = activeRooms.get(roomId);
        if (activeRoom) {
          activeRoom.participants.delete(socket.id);
          if (activeRoom.participants.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      }
    });
  });
};

module.exports = callHandlers;
