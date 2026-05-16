const express = require("express");

const Order = require("../models/Order");
const Product = require("../models/Product");

const router = express.Router();

async function updateProductSales(items = []) {
  await Promise.all(
    items
      .filter((item) => item.id)
      .map((item) =>
        Product.updateOne(
          { id: item.id },
          {
            $inc: {
              sales: Number(item.quantity || 1),
              stock: -Number(item.quantity || 1),
            },
          }
        )
      )
  );
}

router.get("/", async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = req.body;
    const existingOrder = payload.id ? await Order.findOne({ id: payload.id }) : null;

    const order = existingOrder
      ? await Order.findOneAndUpdate(
          { id: payload.id },
          { $set: payload },
          { new: true, runValidators: true }
        )
      : await Order.create(payload);

    if (!existingOrder) {
      await updateProductSales(order.items);
    }

    res.status(existingOrder ? 200 : 201).json(order);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
