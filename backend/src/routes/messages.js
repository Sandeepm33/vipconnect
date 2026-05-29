const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// @route  GET /api/messages/:chatId — Get messages for a chat
router.get(
  '/:chatId',
  protect,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    if (!require('mongoose').Types.ObjectId.isValid(req.params.chatId)) {
      res.status(400);
      throw new Error('Invalid chat ID format');
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      members: req.user._id,
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    const messages = await Message.find({
      chat: req.params.chatId,
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    })
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments({
      chat: req.params.chatId,
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// @route  POST /api/messages/:chatId — Send a message
router.post(
  '/:chatId',
  protect,
  asyncHandler(async (req, res) => {
    const { content, type, replyTo } = req.body;

    if (!require('mongoose').Types.ObjectId.isValid(req.params.chatId)) {
      res.status(400);
      throw new Error('Invalid chat ID format');
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      members: req.user._id,
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (chat.isGroup && chat.settings?.adminOnlyMessage) {
      const isAdmin = chat.admins.some(a => a.toString() === req.user._id.toString());
      if (!isAdmin) {
        res.status(403);
        throw new Error('Only admins can send messages in this group');
      }
    }

    const message = await Message.create({
      chat: req.params.chatId,
      sender: req.user._id,
      type: type || 'text',
      content: content || '',
      replyTo: replyTo || null,
    });

    // Update last message
    chat.lastMessage = message._id;
    await chat.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      });

    res.status(201).json({ success: true, message: populated });
  })
);

// @route  DELETE /api/messages/:id — Delete a message
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { deleteForEveryone } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    const chat = await Chat.findById(message.chat);
    let canDeleteForEveryone = message.sender.toString() === req.user._id.toString();
    const isOver5Mins = (Date.now() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;
    
    if (canDeleteForEveryone && isOver5Mins) {
      canDeleteForEveryone = false; // Sender cannot delete after 5 mins
    }
    
    if (!canDeleteForEveryone && chat?.isGroup) {
      const isAdmin = chat.admins.some(a => a.toString() === req.user._id.toString());
      if (isAdmin) canDeleteForEveryone = true; // Admins bypass the 5-min limit
    }

    if (deleteForEveryone && canDeleteForEveryone) {
      message.deletedForEveryone = true;
      message.content = 'This message was deleted';
      
      // Emit to all clients in the chat room
      const io = req.app.get('io');
      if (io) {
        io.to(message.chat.toString()).emit('message_deleted', {
          messageId: message._id,
          chatId: message.chat,
          deleteForEveryone: true,
        });
      }
    } else {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
      // Emit to the user who deleted it for themselves
      const io = req.app.get('io');
      if (io) {
        const userSocketId = req.app.get('onlineUsers')?.get(req.user._id.toString());
        if (userSocketId) {
          io.to(userSocketId).emit('message_deleted', {
            messageId: message._id,
            chatId: message.chat,
            deleteForEveryone: false,
          });
        }
      }
    }

    await message.save();
    res.json({ success: true, message });
  })
);

// @route  PUT /api/messages/:id/read — Mark message as read
router.put(
  '/:id/read',
  protect,
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) return res.json({ success: true });

    const alreadyRead = message.readBy.some(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
      await message.save();
    }

    res.json({ success: true });
  })
);

module.exports = router;
