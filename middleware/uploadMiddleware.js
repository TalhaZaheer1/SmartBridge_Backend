const multer = require('multer');
const path = require('path');

/**
 * Factory function to create multer config for a specific folder
 * @param {'products' | 'recharges'} folderName
 */
const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `uploads/${folderName}/`);
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    },
  });

  return multer({ storage });
};

// Exports for different use cases
module.exports = {
  uploadProductImage: createUploader('products'),
  uploadRechargeScreenshot: createUploader('recharges'),
  uploadQrImage: createUploader('qr')
};
