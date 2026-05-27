const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
    },
    about: {
      type: String,
      default: 'Hey there! I am using VipConnect.',
      maxlength: [139, 'About cannot exceed 139 characters'],
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    socketId: {
      type: String,
      default: null,
    },
    isBusiness: {
      type: Boolean,
      default: false,
    },
    businessHours: {
      type: String,
      default: '9:00 AM - 5:00 PM',
    },
    quickReplies: [
      {
        trigger: { type: String, required: true },
        reply: { type: String, required: true },
      }
    ],
    walletBalance: {
      type: Number,
      default: 1000,
    },
    upiId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Hash password before save & set default UPI ID
userSchema.pre('save', async function (next) {
  if (!this.upiId && this.email) {
    this.upiId = `${this.email.split('@')[0]}@connectx`;
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    about: this.about,
    status: this.status,
    lastSeen: this.lastSeen,
    isBusiness: this.isBusiness,
    businessHours: this.businessHours,
    quickReplies: this.quickReplies,
    walletBalance: this.walletBalance,
    upiId: this.upiId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
