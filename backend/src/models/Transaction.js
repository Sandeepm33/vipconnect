const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    type: {
      type: String,
      enum: ['upi', 'wallet'],
      default: 'wallet',
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success',
    },
    note: {
      type: String,
      default: '',
      maxlength: [100, 'Note cannot exceed 100 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
