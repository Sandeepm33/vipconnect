const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const path = require('path');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route  POST /api/uploads/message/:chatId — Upload file for a message
router.post(
  '/message/:chatId',
  protect,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file provided');
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      members: req.user._id,
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    let type = 'document';
    let subDir = 'documents';

    if (isImage) {
      type = 'image';
      subDir = 'images';
    } else if (isAudio) {
      type = 'audio';
      subDir = 'audio';
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${subDir}/${req.file.filename}`;

    const message = await Message.create({
      chat: req.params.chatId,
      sender: req.user._id,
      type,
      content: req.body.caption || '',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      replyTo: req.body.replyTo || null,
    });

    chat.lastMessage = message._id;
    await chat.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } });

    res.status(201).json({ success: true, message: populated });
  })
);

module.exports = router;
