const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getSelectableProducts,
  getStoreProducts,
  adoptProduct,
  
} = require('../controllers/productController');

const { protect, isAdmin, isVendor } = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../middleware/uploadMiddleware');


router.get('/public', getPublicProducts); 

router.get('/',protect, isAdmin, getAllProducts);
router.post('/',protect, isAdmin, uploadProductImage.single('image'), createProduct);
router.put('/:id',protect, isAdmin, uploadProductImage.single('image'), updateProduct);
router.delete('/:id',protect, isAdmin, deleteProduct);

router.get('/selectable', protect, isVendor, getSelectableProducts); 
router.put('/adopt/:id', protect, isVendor, adoptProduct); 
router.get('/mine', protect, isVendor, getStoreProducts); 

module.exports = router;
