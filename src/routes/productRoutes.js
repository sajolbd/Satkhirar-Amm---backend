const express = require("express");
const mongoose = require("mongoose");

const ensureDatabaseReady = require("../config/runtime");
const Product = require("../models/Product");
const seedProducts = require("../data/seedProducts");

const router = express.Router();
const DEFAULT_PRODUCT_IMAGE = "/images/hero/mango-slide-1.png";
const defaultConnectionTimeoutMs = 5000;
const defaultQueryTimeoutMs = 8000;
let productCache = seedProducts.map(normalizeProductForResponse);

function createProductId() {
  return `SA-NEW-${Date.now().toString().slice(-6)}`;
}

function getDiscountLabel(amount, label = "") {
  const numericAmount = Number(amount || 0);
  return numericAmount > 0 ? `${numericAmount.toLocaleString("bn-BD")} টাকা ডিসকাউন্ট` : label;
}

const productMenus = [
  { slug: "mango", category: "আম", aliases: ["আম"] },
  { slug: "ghi", category: "ঘি", aliases: ["ঘি"] },
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

function productMatchesFilter(product, filter) {
  if (filter.isActive !== undefined && product.isActive !== filter.isActive) {
    return false;
  }

  if (filter.status?.$ne && product.status === filter.status.$ne) {
    return false;
  }

  if (filter.isFeatured !== undefined && product.isFeatured !== filter.isFeatured) {
    return false;
  }

  if (filter.category && product.category !== filter.category) {
    return false;
  }

  if (filter.menuSlug && product.menuSlug !== filter.menuSlug) {
    return false;
  }

  if (filter.$or) {
    const search = String(filter.$or[0]?.name?.$regex || "").toLowerCase();
    const text = [product.name, product.variety, product.category, product.id]
      .join(" ")
      .toLowerCase();

    return text.includes(search);
  }

  return true;
}

function sortProducts(products) {
  return [...products].sort((firstProduct, secondProduct) => {
    const sortDiff =
      Number(firstProduct.sortOrder || 999) -
      Number(secondProduct.sortOrder || 999);

    if (sortDiff !== 0) return sortDiff;

    return (
      new Date(secondProduct.createdAt || 0).getTime() -
      new Date(firstProduct.createdAt || 0).getTime()
    );
  });
}

function normalizeProductForResponse(product) {
  const plainProduct = product?.toJSON ? product.toJSON() : { ...product };
  const image = String(plainProduct.image || "");

  return {
    ...plainProduct,
    image: image && !image.startsWith("data:") ? image : DEFAULT_PRODUCT_IMAGE,
  };
}

function serializeProduct(product) {
  return normalizeProductForResponse(product);
}

function cacheProduct(product) {
  const plainProduct = normalizeProductForResponse(product);
  const index = productCache.findIndex((item) => item.id === plainProduct.id);

  if (index >= 0) {
    productCache[index] = plainProduct;
  } else {
    productCache = [plainProduct, ...productCache];
  }

  return plainProduct;
}

function replaceProductCache(products) {
  productCache = sortProducts(products.map(normalizeProductForResponse));
}

function getEnvTimeoutMs(name, fallbackMs) {
  const timeoutMs = Number(process.env[name]);

  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : fallbackMs;
}

function getConnectionTimeoutMs() {
  return getEnvTimeoutMs(
    "PRODUCT_DATABASE_READY_TIMEOUT_MS",
    defaultConnectionTimeoutMs,
  );
}

function getQueryTimeoutMs() {
  return getEnvTimeoutMs("MONGODB_QUERY_TIMEOUT_MS", defaultQueryTimeoutMs);
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function getCachedProducts(filter) {
  return sortProducts(productCache.filter((product) => productMatchesFilter(product, filter)));
}

function withTimeout(promise, timeoutMs) {
  let timeout;
  const pendingPromise = Promise.resolve(promise);

  return Promise.race([
    pendingPromise.finally(() => clearTimeout(timeout)),
    new Promise((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`Product query exceeded ${timeoutMs}ms.`)),
        timeoutMs,
      );
    }),
  ]);
}

async function ensureProductsDatabaseConnection() {
  if (isDatabaseConnected()) {
    return true;
  }

  try {
    await withTimeout(ensureDatabaseReady(), getConnectionTimeoutMs());
    return isDatabaseConnected();
  } catch (error) {
    console.error(
      "Product API using cached products while database is unavailable:",
      error.message,
    );
    return false;
  }
}

function fetchProducts(filter) {
  return Product.aggregate([
    { $match: filter },
    {
      $addFields: {
        safeImage: {
          $cond: [
            {
              $regexMatch: {
                input: { $ifNull: ["$image", ""] },
                regex: /^data:/,
              },
            },
            DEFAULT_PRODUCT_IMAGE,
            { $ifNull: ["$image", DEFAULT_PRODUCT_IMAGE] },
          ],
        },
      },
    },
    {
      $project: {
        _id: { $toString: "$_id" },
        id: 1,
        name: 1,
        variety: 1,
        category: 1,
        unit: 1,
        price: 1,
        purchasePrice: 1,
        menuSlug: 1,
        discountLabel: 1,
        discountAmount: 1,
        image: "$safeImage",
        shortNote: 1,
        stock: 1,
        sales: 1,
        status: 1,
        color: 1,
        isActive: 1,
        isFeatured: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]).option({ maxTimeMS: getQueryTimeoutMs() });
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

    const databaseReady = await ensureProductsDatabaseConnection();

    if (!databaseReady) {
      return res.json(getCachedProducts(filter));
    }

    try {
      const products = await withTimeout(fetchProducts(filter), getQueryTimeoutMs());

      if (Object.keys(filter).length === 0) {
        replaceProductCache(products);
      } else {
        products.forEach(cacheProduct);
      }

      res.json(sortProducts(products.map(normalizeProductForResponse)));
    } catch (error) {
      console.error("Product query fell back to cache:", error.message);
      res.json(getCachedProducts(filter));
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    await ensureDatabaseReady();

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
    res.status(201).json(cacheProduct(product));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    await ensureDatabaseReady();

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

    res.json(cacheProduct(product));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ensureDatabaseReady();

    const product = await Product.findOneAndDelete({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    productCache = productCache.filter((item) => item.id !== req.params.id);

    res.json({ ok: true, product });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
