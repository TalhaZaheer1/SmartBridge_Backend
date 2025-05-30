const User = require("../models/User");
const Order = require("../models/Order");
const deleteFile = require("../utils/deleteFile");
const bcrypt = require('bcryptjs');

// Get all users (filter by role)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query; // optional filter
    const query = role ? { role } : {};
    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Admin creates a new user (store or customer)
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, role, storeLevel, feeRatio, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!["store", "candidate"].includes(role)) {
      return res.status(400).json({ message: "Invalid role for creation" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      role,
      password: hash,
      storeLevel: storeLevel || "800U",
      feeRatio: Number(feeRatio) || 0,
      isVerified: true,
    });

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Error creating user" });
  }
};


// Admin updates user info (store level, balance, category, feeRatio)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, storeLevel, category, feeRatio, balance } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.storeLevel = storeLevel || user.storeLevel;
    user.category = category || user.category;
    user.feeRatio = feeRatio ?? user.feeRatio;
    user.balance = balance ?? user.balance;

    await user.save();
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};

// Admin deletes a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete recharge screenshots
    user.rechargeHistory.forEach((entry) => {
      if (entry.screenshot) deleteFile(`uploads/recharges/${entry.screenshot}`);
    });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Admin manually adjusts balance (e.g. deduct or add)
exports.adjustBalance = async (req, res) => {
   try {
    const { amount, note } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance = (user.balance || 0) + amount;
    user.rechargeHistory.push({
      amount,
      note,
      approvedBy: req.user?._id,
    });

    await user.save();
    res.json({ message: "Balance adjusted", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Balance adjustment failed" });
  }
};
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await user.save();

    res.json({ message: 'User status updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};
// Admin views single user
exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ["store", "candidate"] } });
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("buyer", "name"); // optional: show buyer name

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Error loading dashboard data" });
  }
};

exports.getVendorDashboard = async (req, res) => {
  try {
    const assignedOrders = await Order.find({ vendor: req.user._id }).countDocuments();

    res.json({
      assignedOrders,
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading vendor dashboard" });
  }
};
exports.getCustomerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const myOrders = await Order.countDocuments({ customer: req.user._id });

    res.json({
      currentBalance: user.balance,
      myOrders,
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading customer dashboard" });
  }
};
