const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// 🔄 Utils for deleting image files
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// ✅ Admin: Upload new product
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, storeLevels } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Title, price, and category are required" });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await Product.create({
      title,
      description,
      price,
      category,
      storeLevels: storeLevels ? storeLevels.split(",") : [],
      image: imagePath,
      uploadedBy: req.user._id, // Admin ID from token
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("❌ Create Product Error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// ✅ Admin: Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

// ✅ Admin: Edit product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, storeLevels } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (req.file) {
      if (product.image) deleteFile(product.image);
      product.image = `/uploads/products/${req.file.filename}`;
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price ?? product.price;
    product.category = category || product.category;
    product.storeLevels = storeLevels ? storeLevels.split(",") : product.storeLevels;

    await product.save();
    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ✅ Admin: Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.image) deleteFile(product.image);

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Product Error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ✅ Customer: View adopted (public) products
exports.getPublicProducts = async (req, res) => {
  try {
    const products = await Product.find({ adoptedBy: { $ne: null } }).populate("adoptedBy", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch public products' });
  }
};

// ✅ Store: Adopt product by ID
exports.adoptProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.adoptedBy) {
      return res.status(400).json({ message: 'Product already adopted' });
    }

    product.adoptedBy = req.user._id;
    await product.save();

    res.json({ message: 'Product adopted successfully', product });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Failed to adopt product' });
  }
};

// ✅ Store: View adopted products by store
exports.getStoreProducts = async (req, res) => {
  try {
    const products = await Product.find({ adoptedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch store products' });
  }
};

// ✅ Store: Get available products for adoption (optionally by category)
exports.getSelectableProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { adoptedBy: null };
    if (category) query.category = category;

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch selectable products' });
  }
};
