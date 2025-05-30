const express = require("express");
const router = express.Router();
const { uploadQrImage } = require("../middleware/uploadMiddleware");
const {
  getPaymentConfig,
  updatePaymentConfigWithFiles,
} = require("../controllers/paymentController");

router.get("/config", getPaymentConfig);

router.post(
  "/update",
  uploadQrImage.fields([
    { name: "wechatQr", maxCount: 1 },
    { name: "usdtQr", maxCount: 1 },
  ]),
  updatePaymentConfigWithFiles
);

module.exports = router;
