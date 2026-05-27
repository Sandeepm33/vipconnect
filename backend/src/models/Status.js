const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['text', 'image', 'video', 'voice'],
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: [200, 'Caption cannot exceed 200 characters'],
    },
    backgroundColor: {
      type: String,
      default: '#7c3aed', // Default purple background for text stories
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    privacy: {
      type: String,
      enum: ['everyone', 'contacts'],
      default: 'everyone',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Status', statusSchema);
