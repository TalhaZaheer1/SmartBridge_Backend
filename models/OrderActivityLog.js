const mongoose = require("mongoose");

const orderActivityLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "delivered", "cancelled"],
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  note: { type: String },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OrderActivityLog", orderActivityLogSchema);
