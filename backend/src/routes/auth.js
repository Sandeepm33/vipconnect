const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @route  POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({ name, email, password, phone: phone || '' });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  })
);

// @route  POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email: loginId, password } = req.body;

    if (!loginId || !password) {
      res.status(400);
      throw new Error('Please provide email/phone and password');
    }

    const user = await User.findOne({ 
      $or: [{ email: loginId }, { phone: loginId }]
    }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  })
);

// @route  GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user.toSafeObject() });
  })
);

// Error handler
router.use((err, req, res, next) => {
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: err.message,
  });
});

module.exports = router;
