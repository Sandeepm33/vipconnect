const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// @route  GET /api/chats — Get all chats for current user
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name avatar status lastSeen')
      .populate('lastMessage')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  })
);

// @route  POST /api/chats — Create or get 1:1 chat
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error('userId is required');
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate('members', 'name avatar status lastSeen about')
      .populate('lastMessage');

    if (chat) {
      return res.json({ success: true, chat });
    }

    // Create new chat
    chat = await Chat.create({
      isGroup: false,
      members: [req.user._id, userId],
    });

    chat = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen about'
    );

    res.status(201).json({ success: true, chat });
  })
);

// @route  POST /api/chats/group — Create group chat
router.post(
  '/group',
  protect,
  (req, res, next) => {
    req.uploadType = 'group';
    next();
  },
  upload.single('groupPicture'),
  asyncHandler(async (req, res) => {
    const { name, members, description } = req.body;

    if (!name || !members) {
      res.status(400);
      throw new Error('Group name and members are required');
    }

    let memberIds = JSON.parse(members);
    if (!memberIds.includes(req.user._id.toString())) {
      memberIds.push(req.user._id.toString());
    }

    let groupPicture = { url: '', filename: '' };
    if (req.file) {
      const { url, filename } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'groups'
      );
      groupPicture = { url, filename };
    }

    const chat = await Chat.create({
      isGroup: true,
      name,
      description: description || '',
      groupPicture,
      members: memberIds,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    // Create system message
    await Message.create({
      chat: chat._id,
      sender: req.user._id,
      type: 'system',
      content: `${req.user.name} created this group`,
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('members', 'name avatar status lastSeen')
      .populate('admins', 'name avatar');

    res.status(201).json({ success: true, chat: populatedChat });
  })
);

// @route  GET /api/chats/:id — Get chat by ID
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findOne({
      _id: req.params.id,
      members: req.user._id,
    })
      .populate('members', 'name avatar status lastSeen about')
      .populate('admins', 'name avatar')
      .populate('lastMessage');

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    res.json({ success: true, chat });
  })
);

// @route  PUT /api/chats/:id/group — Update group info
router.put(
  '/:id/group',
  protect,
  (req, res, next) => {
    req.uploadType = 'group';
    next();
  },
  upload.single('groupPicture'),
  asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can update group info');
    }

    if (req.body.name) chat.name = req.body.name;
    if (req.body.description !== undefined) chat.description = req.body.description;

    if (req.file) {
      const { url, filename } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'groups'
      );
      chat.groupPicture = { url, filename };
    }

    await chat.save();

    const updated = await Chat.findById(chat._id)
      .populate('members', 'name avatar status lastSeen')
      .populate('admins', 'name avatar');

    res.json({ success: true, chat: updated });
  })
);

// @route  PUT /api/chats/:id/members — Add members to group
router.put(
  '/:id/members',
  protect,
  asyncHandler(async (req, res) => {
    const { userIds } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can add members');
    }

    const newMembers = userIds.filter(
      (id) => !chat.members.map((m) => m.toString()).includes(id)
    );
    chat.members.push(...newMembers);
    await chat.save();

    const updated = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen'
    );

    res.json({ success: true, chat: updated });
  })
);

// @route  DELETE /api/chats/:id/members/:userId — Remove member from group
router.delete(
  '/:id/members/:userId',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    const isAdmin = chat.admins.map((a) => a.toString()).includes(req.user._id.toString());
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      res.status(403);
      throw new Error('Not authorized');
    }

    chat.members = chat.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    chat.admins = chat.admins.filter(
      (a) => a.toString() !== req.params.userId
    );
    await chat.save();

    res.json({ success: true, message: 'Member removed' });
  })
);

// @route  PUT /api/chats/:id/admins/:userId — Promote member to admin
router.put(
  '/:id/admins/:userId',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can promote members');
    }

    if (!chat.members.includes(req.params.userId)) {
      res.status(400);
      throw new Error('User is not a member of this group');
    }

    if (!chat.admins.includes(req.params.userId)) {
      chat.admins.push(req.params.userId);
      await chat.save();
    }

    const updated = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen'
    ).populate('admins', 'name avatar');

    res.json({ success: true, chat: updated });
  })
);

// @route  DELETE /api/chats/:id/admins/:userId — Demote admin to member
router.delete(
  '/:id/admins/:userId',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can demote members');
    }

    // Prevent demoting the creator if we want, or just ensure at least 1 admin remains
    if (chat.admins.length === 1 && chat.admins.includes(req.params.userId)) {
      res.status(400);
      throw new Error('Group must have at least one admin');
    }

    chat.admins = chat.admins.filter(a => a.toString() !== req.params.userId);
    await chat.save();

    const updated = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen'
    ).populate('admins', 'name avatar');

    res.json({ success: true, chat: updated });
  })
);

// @route  PUT /api/chats/:id/settings — Update group settings
router.put(
  '/:id/settings',
  protect,
  asyncHandler(async (req, res) => {
    const { adminOnlyMessage, adminOnlyInfo } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can update settings');
    }

    if (!chat.settings) chat.settings = {};
    if (adminOnlyMessage !== undefined) chat.settings.adminOnlyMessage = adminOnlyMessage;
    if (adminOnlyInfo !== undefined) chat.settings.adminOnlyInfo = adminOnlyInfo;

    await chat.save();

    const updated = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen'
    ).populate('admins', 'name avatar');

    res.json({ success: true, chat: updated });
  })
);

// @route  POST /api/chats/:id/invite — Generate/Reset invite link
router.post(
  '/:id/invite',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat || !chat.isGroup) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!chat.admins.includes(req.user._id)) {
      res.status(403);
      throw new Error('Only admins can manage invite links');
    }

    const crypto = require('crypto');
    chat.inviteLink = crypto.randomBytes(12).toString('hex');
    await chat.save();

    res.json({ success: true, inviteLink: chat.inviteLink });
  })
);

// @route  POST /api/chats/invite/:link/join — Join group via invite link
router.post(
  '/invite/:link/join',
  protect,
  asyncHandler(async (req, res) => {
    const chat = await Chat.findOne({ inviteLink: req.params.link, isGroup: true });

    if (!chat) {
      res.status(404);
      throw new Error('Invalid or expired invite link');
    }

    if (!chat.members.includes(req.user._id)) {
      chat.members.push(req.user._id);
      await chat.save();
    }

    const updated = await Chat.findById(chat._id).populate(
      'members',
      'name avatar status lastSeen'
    ).populate('admins', 'name avatar');

    res.json({ success: true, chat: updated });
  })
);

module.exports = router;
