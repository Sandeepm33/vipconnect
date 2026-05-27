const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Status = require('../models/Status');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// @route  POST /api/status — Create new status
router.post(
  '/',
  protect,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    let mediaUrl = '';
    let mediaType = req.body.mediaType || 'text';
    let caption = req.body.caption || '';
    let backgroundColor = req.body.backgroundColor || '#7c3aed';

    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      const isVideo = req.file.mimetype.startsWith('video/');
      const isAudio = req.file.mimetype.startsWith('audio/');
      
      if (isImage) mediaType = 'image';
      else if (isVideo) mediaType = 'video';
      else if (isAudio) mediaType = 'voice';
      else mediaType = 'image'; // Fallback

      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'stories');
      mediaUrl = url;
    } else if (req.body.text) {
      mediaType = 'text';
      caption = req.body.text;
    } else {
      res.status(400);
      throw new Error('Please provide status text or upload a media file');
    }

    const newStatus = await Status.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      caption,
      backgroundColor,
      privacy: req.body.privacy || 'everyone',
    });

    const populated = await Status.findById(newStatus._id)
      .populate('user', 'name avatar')
      .populate('views.user', 'name avatar');
    res.status(201).json({ success: true, status: populated });
  })
);

// @route  GET /api/status — Get active statuses
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    // Get all statuses from the last 24h
    // Since TTL is set to 24h, mongoose query will naturally yield only unexpired status documents
    const statuses = await Status.find()
      .populate('user', 'name avatar')
      .populate('views.user', 'name avatar')
      .sort({ createdAt: -1 });

    // Deduplicate views for each status in the response to guarantee uniqueness
    const sanitizedStatuses = statuses.map((status) => {
      const statusObj = status.toObject ? status.toObject() : status;
      const uniqueViews = [];
      const seenUserIds = new Set();

      if (statusObj.views && Array.isArray(statusObj.views)) {
        statusObj.views.forEach((view) => {
          const userId = view.user?._id?.toString() || view.user?.toString();
          if (userId && !seenUserIds.has(userId)) {
            seenUserIds.add(userId);
            uniqueViews.push(view);
          }
        });
      }
      statusObj.views = uniqueViews;
      return statusObj;
    });

    res.json({ success: true, statuses: sanitizedStatuses });
  })
);

// @route  POST /api/status/:id/view — View status
router.post(
  '/:id/view',
  protect,
  asyncHandler(async (req, res) => {
    const statusObj = await Status.findById(req.params.id);
    if (!statusObj) {
      res.status(404);
      throw new Error('Status not found or expired');
    }

    // Only record views for other users' statuses
    if (statusObj.user.toString() !== req.user._id.toString()) {
      // 1. In-memory check to prevent redundant writes
      const hasViewed = statusObj.views.some(
        (v) => v.user && v.user.toString() === req.user._id.toString()
      );

      if (!hasViewed) {
        const userIdObj = new mongoose.Types.ObjectId(req.user._id);
        // 2. Atomic push to prevent duplicate views due to concurrent requests/race conditions
        await Status.updateOne(
          { _id: req.params.id, 'views.user': { $ne: userIdObj } },
          { $push: { views: { user: userIdObj, viewedAt: new Date() } } }
        );
      }
    }

    res.json({ success: true });
  })
);

// @route  DELETE /api/status/:id — Delete status
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const statusObj = await Status.findById(req.params.id);
    if (!statusObj) {
      res.status(404);
      throw new Error('Status not found or already expired');
    }

    if (statusObj.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this status');
    }

    await statusObj.deleteOne();
    res.json({ success: true, message: 'Status deleted successfully' });
  })
);

module.exports = router;
