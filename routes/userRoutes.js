const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  adjustBalance,
  getSingleUser,
  getAdminDashboard,
  getVendorDashboard,
  getCustomerDashboard,
  updateUserStatus
} = require('../controllers/userController');

const { protect, isAdmin,isVendor,isCustomer } = require('../middleware/authMiddleware');


router.get('/',protect, isAdmin, getAllUsers);
router.get('/:id',protect, isAdmin, getSingleUser);
router.post('/',protect, isAdmin, createUser);
router.put('/:id',protect, isAdmin, updateUser);
router.delete('/:id',protect, isAdmin, deleteUser);
router.post('/:id/adjust-balance',protect, isAdmin, adjustBalance);
router.put('/:id/status', protect, isAdmin, updateUserStatus);

router.get("/dashboard/admin", protect, isAdmin, getAdminDashboard);
router.get("/dashboard/vendor", protect, isVendor, getVendorDashboard);
router.get("/dashboard/customer", protect, isCustomer, getCustomerDashboard);

module.exports = router;
