const express = require('express');
const { registerUser, verifyOTP, loginUser, forgotPassword, resetPassword, getUserProfile } = require('../controllers/authController');
const { isCustomer, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/profile',protect, getUserProfile);

module.exports = router;
