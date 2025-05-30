const mongoose = require("mongoose");

const paymentConfigSchema = new mongoose.Schema({
  wechatQr: String,         // Image path of WeChat QR
  wechatId: String,         // Text ID for WeChat
  usdtQr: String,           // Image path of USDT QR
  usdtAddress: String,      // Wallet address for USDT TRC20
  description1: String,     // "How payment works"
  description2: String      // "Store-level benefits"
}, { timestamps: true });

module.exports = mongoose.model("PaymentConfig", paymentConfigSchema);
