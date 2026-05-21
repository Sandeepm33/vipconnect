const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [512, 'Description too long'],
    },
    groupPicture: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    settings: {
      adminOnlyMessage: { type: Boolean, default: false },
      adminOnlyInfo: { type: Boolean, default: false },
    },
    inviteLink: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for faster queries
chatSchema.index({ members: 1 });

module.exports = mongoose.model('Chat', chatSchema);
