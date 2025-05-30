const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const XLSX = require("xlsx"); // For CSV
const PDFDocument = require("pdfkit");
const OrderActivityLog = require("../models/OrderActivityLog");

// Admin: Create order and deduct balance manually
const createOrder = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { productId } = req.body;

    // ✅ Step 1: Validate input
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // ✅ Step 2: Fetch buyer and product
    const buyer = await User.findById(buyerId);
    const product = await Product.findById(productId);

    if (!buyer || !product) {
      return res.status(404).json({ message: 'Invalid buyer or product' });
    }

    // ✅ Step 3: Check if product is adopted by any store
    if (!product.adoptedBy) {
      return res.status(403).json({ message: 'Product has not been assigned to any vendor/store' });
    }

    // ✅ Step 4: Get the vendor
    const vendor = await User.findById(product.adoptedBy);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found for this product' });
    }

    // ✅ Step 5: Calculate fee and total cost
    const feeRatio = buyer.feeRatio || 0;
    const feeAmount = (product.price * feeRatio) / 100;
    const totalCost = product.price + feeAmount;

    // ✅ Step 6: Just log balance info (don't deduct)
    console.log(`User Balance: ${buyer.balance}, Total Cost: ${totalCost}`);

    // ✅ Step 7: Create order without balance deduction
    const order = await Order.create({
      product: product._id,
      buyer: buyer._id,
      vendor: vendor._id,
      price: product.price,
      fee: feeAmount,
      total: totalCost,
      status: 'placed', // Default status
    });

    return res.status(201).json({
      message: 'Order placed successfully. Admin will confirm after balance update.',
      order,
    });

  } catch (err) {
    console.error('❌ Order creation error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// Vendor: View all orders assigned to them
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const orders = await Order.find({ vendor: vendorId }).populate('product buyer', 'name email');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vendor orders' });
  }
};

// Customer: View their own orders
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await Order.find({ buyer: customerId }).populate('product vendor', 'name email');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer orders' });
  }
};
// Update order status
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, note } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  await order.save();

  await OrderActivityLog.create({
    orderId: order._id,
    status,
    note,
    updatedBy: req.user._id,
  });

  res.json({ message: "Order status updated", order });
};
// Admin: Get all orders with optional filters
const getAllOrders = async (req, res) => {
  try {
    const { status, category, from, to, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate({
        path: "product",
        match: category ? { category } : {},
        select: "title price category",
      })
      .populate("buyer", "name email")
      .populate("vendor", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const filtered = orders.filter((o) => o.product !== null);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      count: filtered.length,
      orders: filtered,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};
const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("product", "title price category")
      .populate("buyer", "name email")
      .populate("vendor", "name email");

    const data = orders.map((order) => ({
      OrderID: order._id,
      Product: order.product?.title || "",
      Category: order.product?.category || "",
      Buyer: order.buyer?.name || "",
      Vendor: order.vendor?.name || "",
      Price: order.price,
      Status: order.status,
      Date: order.createdAt.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: "CSV export failed", error: err.message });
  }
};
const exportOrdersPDF = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("product", "title price")
      .populate("buyer", "name")
      .populate("vendor", "name");

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Disposition", "attachment; filename=orders.pdf");
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Order Report", { align: "center" });
    doc.moveDown();

    orders.forEach((order, i) => {
      doc.fontSize(12).text(`Order #${i + 1}`);
      doc.text(`Product: ${order.product?.title}`);
      doc.text(`Buyer: ${order.buyer?.name}`);
      doc.text(`Vendor: ${order.vendor?.name}`);
      doc.text(`Price: $${order.price}`);
      doc.text(`Status: ${order.status}`);
      doc.text(`Date: ${order.createdAt.toISOString()}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "PDF export failed", error: err.message });
  }
};



module.exports = {
  createOrder,
  exportOrdersPDF,
  exportOrdersCSV,
  getVendorOrders,
  getCustomerOrders,
  updateOrderStatus,
  getAllOrders
};
