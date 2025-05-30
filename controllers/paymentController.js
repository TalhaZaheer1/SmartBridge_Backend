const PaymentConfig = require("../models/paymentConfig");

exports.getPaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne();
    if (!config) return res.status(404).json({ message: "No config found" });
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updatePaymentConfigWithFiles = async (req, res) => {
  try {
    const existing = await PaymentConfig.findOne();

    const data = {
      wechatId: req.body.wechatId,
      usdtAddress: req.body.usdtAddress,
      description1: req.body.description1,
      description2: req.body.description2,
    };

    if (req.files["wechatQr"]) {
      data.wechatQr = req.files["wechatQr"][0].path.replace("\\", "/");
    }
    if (req.files["usdtQr"]) {
      data.usdtQr = req.files["usdtQr"][0].path.replace("\\", "/");
    }

    if (existing) {
      await PaymentConfig.updateOne({}, data);
    } else {
      await PaymentConfig.create(data);
    }

    res.json({ message: "Payment config updated with images" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
