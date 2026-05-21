const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date },
        leftAt: { type: Date },
        status: {
          type: String,
          enum: ['invited', 'accepted', 'rejected', 'missed', 'left'],
          default: 'invited',
        },
      },
    ],
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ringing', 'ongoing', 'completed', 'missed', 'rejected'],
      default: 'ringing',
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    roomId: {
      type: String, // unique room ID for WebRTC signaling
      required: true,
    },
  },
  { timestamps: true }
);

callSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
