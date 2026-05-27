const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// @route  POST /api/communities — Create community
router.post(
  '/',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Community name is required');
    }

    let image = { url: '', filename: '' };
    if (req.file) {
      const { url, filename } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'communities');
      image = { url, filename };
    }

    const community = await Community.create({
      name,
      description,
      image,
      owner: req.user._id,
      admins: [req.user._id],
      groups: [],
    });

    res.status(201).json({ success: true, community });
  })
);

// @route  GET /api/communities — Get communities
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    // Return communities where user is owner, admin, or a member of any child group
    const userGroups = await Chat.find({ members: req.user._id }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    const communities = await Community.find({
      $or: [
        { owner: req.user._id },
        { admins: req.user._id },
        { groups: { $in: groupIds } },
      ],
    })
      .populate('owner', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('groups', 'name groupPicture members settings');

    res.json({ success: true, communities });
  })
);

// @route  POST /api/communities/:id/groups — Add a group to community
router.post(
  '/:id/groups',
  protect,
  asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    if (!community) {
      res.status(404);
      throw new Error('Community not found');
    }

    // Check permissions
    const isOwner = community.owner.toString() === req.user._id.toString();
    const isAdmin = community.admins.some(a => a.toString() === req.user._id.toString());
    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized to manage this community');
    }

    const { chatId } = req.body;
    if (!chatId) {
      res.status(400);
      throw new Error('Chat ID is required');
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Add group if not already present
    if (!community.groups.includes(chatId)) {
      community.groups.push(chatId);
      await community.save();
    }

    res.json({ success: true, community });
  })
);

// @route  POST /api/communities/:id/broadcast — Broadcast message to all groups
router.post(
  '/:id/broadcast',
  protect,
  asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    if (!community) {
      res.status(404);
      throw new Error('Community not found');
    }

    const isOwner = community.owner.toString() === req.user._id.toString();
    const isAdmin = community.admins.some(a => a.toString() === req.user._id.toString());
    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized to broadcast announcements');
    }

    const { content } = req.body;
    if (!content) {
      res.status(400);
      throw new Error('Announcement text is required');
    }

    const io = req.app.get('io');
    const createdMessages = [];

    // Send announcement message to all sub-groups
    for (const groupId of community.groups) {
      const msg = await Message.create({
        chat: groupId,
        sender: req.user._id,
        type: 'text',
        content: `📢 [Community Announcement] ${content}`,
      });

      const populated = await Message.findById(msg._id).populate('sender', 'name avatar');
      createdMessages.push(populated);

      // Update chat last message
      await Chat.findByIdAndUpdate(groupId, { lastMessage: msg._id, updatedAt: new Date() });

      // Socket broadcast
      if (io) {
        io.to(groupId.toString()).emit('message_received', populated);
      }
    }

    res.json({ success: true, messages: createdMessages });
  })
);

module.exports = router;
