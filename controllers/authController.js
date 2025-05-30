const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res, next) => {
  try {
    let { name, email, password, role, phone } = req.body;
    email = email?.trim().toLowerCase();
    name = name?.trim();
    role = role?.toLowerCase();

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["admin", "store", "candidate"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: false,
    });

    await Otp.create({
      userId: user._id,
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail(
      email,
      "Verify Your Email",
      `<h3>Hello, ${name}!</h3><p>Your OTP is <strong>${otpCode}</strong>. It expires in 10 minutes.</p>`
    );

    res.status(201).json({ message: "Registered. Check your email for OTP." });
  } catch (err) {
    next(err);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const record = await Otp.findOne({ userId: user._id, otp, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    await user.save();
    await Otp.deleteMany({ userId: user._id });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified)
      return res.status(403).json({ message: "Phone not verified" });

    if (user.status === 'inactive')
      return res.status(403).json({ message: "Account is inactive" });

    res.json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        balance: user.balance,
        storeLevel: user.storeLevel,
        feeRatio: user.feeRatio,
        category: user.category
      }
    });
  } catch (err) {
    next(err);
  }
};


exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await PasswordReset.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: Date.now() + 3600000,
    });

    const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail(email, "Reset Password", `<p>Click to reset: <a href="${link}">Reset</a></p>`);

    res.json({ message: "Reset link sent" });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const reset = await PasswordReset.findOne({ token: hashedToken, expiresAt: { $gt: Date.now() } });
    if (!reset) return res.status(400).json({ message: "Token invalid or expired" });

    const user = await User.findById(reset.userId);
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    await PasswordReset.deleteMany({ userId: user._id });

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

