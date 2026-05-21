const Message = require('../models/Message');
const Chat = require('../models/Chat');

const chatHandlers = (io, socket, onlineUsers) => {
  // Join a chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
  });

  // Typing indicators
  socket.on('typing_start', ({ chatId }) => {
    socket.to(chatId).emit('typing_start', {
      chatId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
      },
    });
  });

  socket.on('typing_stop', ({ chatId }) => {
    socket.to(chatId).emit('typing_stop', {
      chatId,
      userId: socket.user._id,
    });
  });

  // Send message via socket (for real-time delivery)
  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, type, replyTo, tempId } = data;

      const chat = await Chat.findOne({
        _id: chatId,
        members: socket.user._id,
      });

      if (!chat) return;

      const message = await Message.create({
        chat: chatId,
        sender: socket.user._id,
        type: type || 'text',
        content: content || '',
        replyTo: replyTo || null,
      });

      chat.lastMessage = message._id;
      await chat.save();

      const populated = await Message.findById(message._id)
        .populate('sender', 'name avatar')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name' },
        });

      // Emit to all in room (including sender for confirmation)
      io.to(chatId).emit('new_message', {
        message: populated,
        tempId,
        chatId,
      });

      // Update last message for all members not in this chat room
      chat.members.forEach((memberId) => {
        const memberIdStr = memberId.toString();
        if (memberIdStr !== socket.user._id.toString()) {
          const memberSocketId = onlineUsers.get(memberIdStr);
          if (memberSocketId) {
            io.to(memberIdStr).emit('chat_updated', {
              chatId,
              lastMessage: populated,
            });
          }
        }
      });
    } catch (err) {
      console.error('send_message error:', err);
      socket.emit('message_error', { error: err.message });
    }
  });

  // File message sent (after REST upload)
  socket.on('file_message_sent', async ({ chatId, messageId }) => {
    try {
      const message = await Message.findById(messageId)
        .populate('sender', 'name avatar')
        .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } });

      if (!message) return;

      io.to(chatId).emit('new_message', { message, chatId });

      const chat = await Chat.findById(chatId);
      chat.members.forEach((memberId) => {
        const memberIdStr = memberId.toString();
        if (memberIdStr !== socket.user._id.toString()) {
          io.to(memberIdStr).emit('chat_updated', { chatId, lastMessage: message });
        }
      });
    } catch (err) {
      console.error('file_message_sent error:', err);
    }
  });

  // Mark messages as read
  socket.on('messages_read', async ({ chatId, messageIds }) => {
    try {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          'readBy.user': { $ne: socket.user._id },
        },
        {
          $push: {
            readBy: { user: socket.user._id, readAt: new Date() },
          },
        }
      );

      socket.to(chatId).emit('messages_read', {
        chatId,
        messageIds,
        readBy: socket.user._id,
      });
    } catch (err) {
      console.error('messages_read error:', err);
    }
  });

  // Delete message
  socket.on('delete_message', async ({ messageId, chatId, deleteForEveryone }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const isOver5Mins = (Date.now() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;

      if (deleteForEveryone && message.sender.toString() === socket.user._id.toString() && !isOver5Mins) {
        message.deletedForEveryone = true;
        message.content = 'This message was deleted';
        await message.save();
        io.to(chatId).emit('message_deleted', { messageId, chatId, deleteForEveryone: true });
      } else {
        if (!message.deletedFor.includes(socket.user._id)) {
          message.deletedFor.push(socket.user._id);
          await message.save();
        }
        socket.emit('message_deleted', { messageId, chatId, deleteForEveryone: false });
      }
    } catch (err) {
      console.error('delete_message error:', err);
    }
  });

  // Edit message
  socket.on('edit_message', async ({ messageId, chatId, newContent }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.deletedForEveryone) return;

      const isOver5Mins = (Date.now() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;
      
      // User must be sender, not a system msg, and within 5 mins
      if (
        message.sender.toString() === socket.user._id.toString() &&
        message.type === 'text' &&
        !isOver5Mins
      ) {
        message.content = newContent;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(chatId).emit('message_edited', {
          messageId,
          chatId,
          content: newContent,
          isEdited: true,
          editedAt: message.editedAt,
        });
      }
    } catch (err) {
      console.error('edit_message error:', err);
    }
  });

  // React to message
  socket.on('react_message', async ({ messageId, chatId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const existingIdx = message.reactions.findIndex(
        (r) => r.user.toString() === socket.user._id.toString()
      );

      if (existingIdx >= 0) {
        if (message.reactions[existingIdx].emoji === emoji) {
          message.reactions.splice(existingIdx, 1); // remove if same
        } else {
          message.reactions[existingIdx].emoji = emoji; // update
        }
      } else {
        message.reactions.push({ user: socket.user._id, emoji });
      }

      await message.save();

      io.to(chatId).emit('message_reaction', {
        messageId,
        chatId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('react_message error:', err);
    }
  });
};

module.exports = chatHandlers;
