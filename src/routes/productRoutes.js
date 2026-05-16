const express = require("express");

const Product = require("../models/Product");

const router = express.Router();

function createProductId() {
  return `SA-NEW-${Date.now().toString().slice(-6)}`;
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    const { active, category, featured, search } = req.query;

    if (active === "true") {
      filter.isActive = true;
      filter.status = { $ne: "বন্ধ" };
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { variety: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      id: req.body.id || createProductId(),
      variety: req.body.variety || req.body.category || "",
      shortNote: req.body.shortNote || req.body.variety || "",
      discountLabel: req.body.discountLabel || "",
      image: req.body.image || "/images/hero/mango-slide-1.png",
      isActive: req.body.isActive ?? true,
      isFeatured: req.body.isFeatured ?? true,
    };

    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const update = { ...req.body };

    if (update.variety === undefined) {
      delete update.variety;
    }

    if (update.shortNote === undefined) {
      delete update.shortNote;
    }

    if (update.discountLabel === undefined) {
      delete update.discountLabel;
    }

    if (update.image === undefined || update.image === "") {
      delete update.image;
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ ok: true, product });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
