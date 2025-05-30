// models/User.js

const mongoose = require('mongoose');

const rechargeHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  screenshot: { type: String }, // file path to uploaded image
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String }, // added for registration
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: {
    type: String,
    enum: ['admin', 'store', 'candidate'],
    default: 'candidate',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  isVerified: { type: Boolean, default: false },

  storeLevel: { type: String, enum: ['800U', '1500U', '3000U', '5000U'], default: '800U' },
  balance: { type: Number, default: 0 },
  feeRatio: { type: Number, default: 0 }, 

  rechargeHistory: [rechargeHistorySchema], // logs each recharge

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
