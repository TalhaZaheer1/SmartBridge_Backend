const express = require('express');
const router = express.Router();
const {
  uploadRechargeScreenshotHandler,
  approveRecharge,
  getPendingRecharges,
  getMyRecharges,
  getAllRecharges,
} = require('../controllers/rechargeController');
const { protect, isAdmin, isCustomer } = require('../middleware/authMiddleware');

const { uploadRechargeScreenshot } = require('../middleware/uploadMiddleware');
router.post('/upload', protect, uploadRechargeScreenshot.single('screenshot'), uploadRechargeScreenshotHandler);

router.get('/pending', protect, isAdmin, getPendingRecharges);
router.post('/approve', protect, isAdmin, approveRecharge);
router.get("/my", protect,isCustomer,getMyRecharges);      
router.get("/", protect, isAdmin, getAllRecharges);

module.exports = router;
