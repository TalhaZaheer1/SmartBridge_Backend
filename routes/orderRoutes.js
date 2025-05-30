const express = require('express');
const router = express.Router();
const {
  createOrder,
  getVendorOrders,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  exportOrdersCSV,
  exportOrdersPDF,
} = require('../controllers/orderController');
const { protect, isAdmin, isVendor, isCustomer } = require('../middleware/authMiddleware');

// Admin creates an order
router.post('/admin/create', protect, isCustomer, createOrder);

// Vendor views orders
router.get('/vendor', protect, isVendor, getVendorOrders);

// Customer views their orders
router.get('/customer', protect, isCustomer, getCustomerOrders);

// Admin views all orders
router.get('/admin/all', protect, isAdmin, getAllOrders);

// Admin or Vendor updates order status
router.put("/:orderId/status", protect, isAdmin, updateOrderStatus);


router.get("/admin/export/csv", protect, isAdmin, exportOrdersCSV);
router.get("/admin/export/pdf", protect, isAdmin, exportOrdersPDF);


module.exports = router;
