const express = require("express");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

router.get("/summary", async (_req, res, next) => {
  try {
    const [orders, productCount, userCount, lowStockCount] = await Promise.all([
      Order.find(),
      Product.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ status: "স্টক কম" }),
    ]);
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: productCount,
      totalUsers: userCount,
      lowStockCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
