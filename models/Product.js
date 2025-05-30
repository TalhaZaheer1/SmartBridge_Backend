// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // Path to image uploaded via Multer
  storeLevels: [{ type: String, enum: ['800U', '1500U', '3000U', '5000U'] }],
  feeRatio: { type: Number, default: 0 },

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
