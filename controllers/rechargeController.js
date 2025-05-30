const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// CUSTOMER: Upload recharge screenshot
exports.uploadRechargeScreenshotHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Screenshot is required" });
    }

    const filePath = `/uploads/recharges/${req.file.filename}`;

    // Save to user's pending recharge (not yet approved)
    const user = await User.findById(userId);
    user.rechargeHistory.push({
      amount: 0, // Admin will add later
      note: "Pending approval",
      screenshot: filePath,
    });

    await user.save();
    res.json({ message: "Screenshot uploaded. Awaiting admin approval." });
  } catch (err) {
    console.error("Recharge upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ADMIN: Approve recharge and set balance
exports.approveRecharge = async (req, res) => {
  try {
    const { userId, rechargeIndex, amount, note } = req.body;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const recharge = user.rechargeHistory[rechargeIndex];
    if (!recharge || recharge.amount !== 0) {
      return res.status(400).json({ message: "Invalid or already approved recharge" });
    }

    recharge.amount = amount;
    recharge.note = note || "Approved by admin";
    recharge.date = new Date();
    recharge.approvedBy = adminId;

    user.balance += amount;
    await user.save();

    res.json({ message: "Recharge approved and balance updated", balance: user.balance });
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
};

// ADMIN: View pending recharges
exports.getPendingRecharges = async (req, res) => {
  try {
    const users = await User.find({
      rechargeHistory: { $elemMatch: { amount: 0 } }
    }).select("name email rechargeHistory");

    const pendingList = [];

    users.forEach(user => {
      user.rechargeHistory.forEach((rec, index) => {
        if (rec.amount === 0) {
          pendingList.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            rechargeIndex: index,
            screenshot: rec.screenshot,
            note: rec.note,
            date: rec.date,
          });
        }
      });
    });

    res.json(pendingList);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending recharges" });
  }
};

exports.getMyRecharges = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ recharges: user.rechargeHistory || [] });
};

// GET /api/recharges - Admin view with filters
exports.getAllRecharges = async (req, res) => {
  const { status, userId, from, to } = req.query;
  const query = {};

  if (userId) query._id = userId;
  if (status) query["rechargeHistory.status"] = status;
  if (from || to) {
    query["rechargeHistory.date"] = {};
    if (from) query["rechargeHistory.date"].$gte = new Date(from);
    if (to) query["rechargeHistory.date"].$lte = new Date(to);
  }

  const users = await User.find(query).select("name email rechargeHistory");
  const recharges = users.flatMap((u) =>
    u.rechargeHistory.map((r) => ({
      ...r.toObject(),
      user: { id: u._id, name: u.name, email: u.email },
    }))
  );

  res.json({ recharges });
};