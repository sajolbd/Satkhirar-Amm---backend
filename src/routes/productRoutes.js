const express = require("express");

const Product = require("../models/Product");

const router = express.Router();

function createProductId() {
  return `SA-NEW-${Date.now().toString().slice(-6)}`;
}

function getDiscountLabel(amount, label = "") {
  const numericAmount = Number(amount || 0);
  return numericAmount > 0 ? `${numericAmount.toLocaleString("bn-BD")} টাকা ডিসকাউন্ট` : label;
}

const productMenus = [
  { slug: "mango", category: "আম", aliases: ["আম"] },
  { slug: "gur", category: "গুড়", aliases: ["গুড়", "গুড়"] },
  { slug: "plants", category: "চারা", aliases: ["চারা"] },
  { slug: "pickle", category: "আচার", aliases: ["আচার"] },
  { slug: "oil", category: "তেল", aliases: ["তেল"] },
  { slug: "honey", category: "মধু", aliases: ["মধু"] },
  {
    slug: "frozen-food",
    category: "ফ্রোজেন ফুড",
    aliases: ["ফ্রোজেন ফুড"],
  },
];

function getMenuByPayload(payload = {}) {
  return (
    productMenus.find((menu) => menu.slug === payload.menuSlug) ||
    productMenus.find((menu) => menu.aliases.includes(payload.category)) ||
    productMenus[0]
  );
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    const { active, category, featured, menuSlug, search } = req.query;

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

    if (menuSlug) {
      filter.menuSlug = menuSlug;
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
    const selectedMenu = getMenuByPayload(req.body);
    const payload = {
      ...req.body,
      id: req.body.id || createProductId(),
      category: selectedMenu.category,
      price: Number(req.body.price ?? req.body.salePrice ?? 0),
      purchasePrice: Number(req.body.purchasePrice || 0),
      menuSlug: selectedMenu.slug,
      variety: req.body.variety || req.body.category || "",
      shortNote: req.body.shortNote || req.body.variety || "",
      discountAmount: Number(req.body.discountAmount || 0),
      discountLabel: getDiscountLabel(req.body.discountAmount, req.body.discountLabel || ""),
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
    const selectedMenu = getMenuByPayload(update);

    if (update.salePrice !== undefined && update.price === undefined) {
      update.price = update.salePrice;
    }

    delete update.salePrice;

    update.category = selectedMenu.category;
    update.menuSlug = selectedMenu.slug;

    if (update.variety === undefined) {
      delete update.variety;
    }

    if (update.shortNote === undefined) {
      delete update.shortNote;
    }

    if (update.discountLabel === undefined) {
      delete update.discountLabel;
    }

    if (update.discountAmount !== undefined) {
      update.discountAmount = Number(update.discountAmount || 0);
      update.discountLabel = getDiscountLabel(update.discountAmount, update.discountLabel || "");
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
