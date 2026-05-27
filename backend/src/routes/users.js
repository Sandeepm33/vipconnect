const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const path = require('path');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// @route  POST /api/users/sync-contacts
// Accepts array of phone numbers, returns matched VipConnect users
router.post(
  '/sync-contacts',
  protect,
  asyncHandler(async (req, res) => {
    const { phones } = req.body; // array of phone number strings
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.json({ success: true, users: [] });
    }

    // Normalize: strip all non-digit chars except leading +
    const normalized = phones.map((p) => p.replace(/[^\d+]/g, ''));

    const users = await User.find({
      _id: { $ne: req.user._id },
      phone: { $in: normalized },
    }).select('name email phone avatar about status lastSeen');

    res.json({ success: true, users });
  })
);

// @route  GET /api/users/search?q=
router.get(
  '/search',
  protect,
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email phone avatar about status lastSeen')
      .limit(20);

    res.json({ success: true, users });
  })
);

// @route  GET /api/users/:id
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(
      'name email phone avatar about status lastSeen'
    );
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ success: true, user });
  })
);

// @route  PUT /api/users/profile
router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const { name, about, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (about !== undefined) user.about = about;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  })
);

// @route  PUT /api/users/avatar
router.put(
  '/avatar',
  protect,
  (req, res, next) => {
    req.uploadType = 'avatar';
    next();
  },
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const user = await User.findById(req.user._id);
    const { url, filename } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'avatars');
    user.avatar = { url, filename };
    await user.save();

    res.json({ success: true, user: user.toSafeObject() });
  })
);

module.exports = router;
