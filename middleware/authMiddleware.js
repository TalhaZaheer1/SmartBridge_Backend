const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect middleware: checks if token is valid
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Generic role-based middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// Shorthand role-checking middlewares
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

const isVendor = (req, res, next) => {
  if (req.user.role !== "store") {
    return res.status(403).json({ message: "Vendors only" });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Customers only" });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isVendor,
  isCustomer,
};
