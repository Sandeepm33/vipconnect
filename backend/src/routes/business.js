const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// @route  GET /api/business/catalog/:userId — Fetch business catalog
router.get(
  '/catalog/:userId',
  protect,
  asyncHandler(async (req, res) => {
    const products = await Product.find({ owner: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  })
);

// @route  POST /api/business/catalog — Add product to catalog
router.post(
  '/catalog',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { name, description, price } = req.body;
    if (!name || !price) {
      res.status(400);
      throw new Error('Product name and price are required');
    }

    let imageUrl = '';
    if (req.file) {
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
      imageUrl = url;
    }

    const product = await Product.create({
      owner: req.user._id,
      name,
      description,
      price: parseFloat(price),
      imageUrl,
    });

    res.status(201).json({ success: true, product });
  })
);

// @route  DELETE /api/business/catalog/:id — Delete product
router.delete(
  '/catalog/:id',
  protect,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (product.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this product');
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted from catalog' });
  })
);

// @route  PUT /api/business/profile — Update business configurations
router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const { isBusiness, businessHours, quickReplies } = req.body;
    const user = await User.findById(req.user._id);

    if (isBusiness !== undefined) user.isBusiness = isBusiness;
    if (businessHours !== undefined) user.businessHours = businessHours;
    if (quickReplies !== undefined) user.quickReplies = quickReplies;

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  })
);

module.exports = router;
