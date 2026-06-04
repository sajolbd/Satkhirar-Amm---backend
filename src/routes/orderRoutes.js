const express = require("express");

const Order = require("../models/Order");
const Product = require("../models/Product");

const router = express.Router();
const defaultOrderQueryTimeoutMs = 8000;
const defaultOrderMutationTimeoutMs = 12000;
let orderCache = [];

function getEnvTimeoutMs(name, fallbackMs) {
  const timeoutMs = Number(process.env[name]);

  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : fallbackMs;
}

function getOrderQueryTimeoutMs() {
  return getEnvTimeoutMs("MONGODB_ORDER_QUERY_TIMEOUT_MS", defaultOrderQueryTimeoutMs);
}

function getOrderMutationTimeoutMs() {
  return getEnvTimeoutMs(
    "MONGODB_ORDER_MUTATION_TIMEOUT_MS",
    defaultOrderMutationTimeoutMs,
  );
}

function withTimeout(promise, timeoutMs, label) {
  let timeout;
  const pendingPromise = Promise.resolve(promise);

  return Promise.race([
    pendingPromise.finally(() => clearTimeout(timeout)),
    new Promise((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`${label} exceeded ${timeoutMs}ms.`)),
        timeoutMs,
      );
    }),
  ]);
}

function sanitizeOrderItem(item = {}) {
  const image = String(item.image || "");

  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    image: image.startsWith("data:") ? "" : image,
  };
}

function sanitizeOrderPayload(payload = {}) {
  return {
    ...payload,
    items: Array.isArray(payload.items)
      ? payload.items.map(sanitizeOrderItem)
      : [],
  };
}

function normalizeOrderForResponse(order) {
  const plainOrder = order?.toJSON ? order.toJSON() : { ...order };

  return sanitizeOrderPayload({
    ...plainOrder,
    _id: plainOrder._id?.toString?.() || plainOrder._id,
  });
}

function replaceOrderCache(orders) {
  orderCache = orders.map(normalizeOrderForResponse);
}

function cacheOrder(order) {
  const plainOrder = normalizeOrderForResponse(order);
  const index = orderCache.findIndex((item) => item.id === plainOrder.id);

  if (index >= 0) {
    orderCache[index] = plainOrder;
  } else {
    orderCache = [plainOrder, ...orderCache];
  }

  return plainOrder;
}

function removeCachedOrder(orderId) {
  orderCache = orderCache.filter((item) => item.id !== orderId);
}

function filterCachedOrders(filter) {
  return orderCache.filter((order) => {
    if (filter["customer.phone"] && order.customer?.phone !== filter["customer.phone"]) {
      return false;
    }

    if (filter["customer.email"] && order.customer?.email !== filter["customer.email"]) {
      return false;
    }

    return true;
  });
}

function fetchOrders(filter) {
  return Order.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: { $toString: "$_id" },
        id: 1,
        source: 1,
        customer: 1,
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              id: "$$item.id",
              name: "$$item.name",
              unit: "$$item.unit",
              quantity: "$$item.quantity",
              price: "$$item.price",
              image: {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $ifNull: ["$$item.image", ""] },
                      regex: /^data:/,
                    },
                  },
                  "",
                  { $ifNull: ["$$item.image", ""] },
                ],
              },
            },
          },
        },
        payment: 1,
        subtotal: 1,
        deliveryCharge: 1,
        total: 1,
        status: 1,
        date: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]).option({ maxTimeMS: getOrderQueryTimeoutMs() });
}

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

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    const phone = String(req.query.phone || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();

    if (phone) {
      filter["customer.phone"] = phone;
    }

    if (email) {
      filter["customer.email"] = email;
    }

    try {
      const orders = await withTimeout(
        fetchOrders(filter),
        getOrderQueryTimeoutMs(),
        "Order query",
      );

      if (Object.keys(filter).length === 0) {
        replaceOrderCache(orders);
      } else {
        orders.forEach(cacheOrder);
      }

      res.json(orders.map(normalizeOrderForResponse));
    } catch (error) {
      console.error("Order query fell back to cache:", error.message);
      res.json(filterCachedOrders(filter));
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = sanitizeOrderPayload(req.body);
    const existingOrder = payload.id
      ? await withTimeout(
          Order.findOne({ id: payload.id }).maxTimeMS(getOrderQueryTimeoutMs()),
          getOrderQueryTimeoutMs(),
          "Existing order lookup",
        )
      : null;

    const order = existingOrder
      ? await withTimeout(
          Order.findOneAndUpdate(
            { id: payload.id },
            { $set: payload },
            { new: true, runValidators: true },
          ),
          getOrderMutationTimeoutMs(),
          "Order update",
        )
      : await withTimeout(
          Order.create(payload),
          getOrderMutationTimeoutMs(),
          "Order create",
        );

    if (!existingOrder) {
      withTimeout(
        updateProductSales(order.items),
        getOrderMutationTimeoutMs(),
        "Product sales update",
      ).catch((error) => {
        console.error("Product sales update skipped after order save:", error.message);
      });
    }

    res.status(existingOrder ? 200 : 201).json(cacheOrder(order));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const order = await withTimeout(
      Order.findOneAndUpdate(
        { id: req.params.id },
        { $set: sanitizeOrderPayload(req.body) },
        { new: true, runValidators: true },
      ),
      getOrderMutationTimeoutMs(),
      "Order update",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(cacheOrder(order));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const order = await withTimeout(
      Order.findOneAndUpdate(
        { id: req.params.id },
        { $set: { status: req.body.status } },
        { new: true, runValidators: true },
      ),
      getOrderMutationTimeoutMs(),
      "Order status update",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(cacheOrder(order));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const order = await withTimeout(
      Order.findOneAndDelete({ id: req.params.id }),
      getOrderMutationTimeoutMs(),
      "Order delete",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    removeCachedOrder(req.params.id);
    res.json({ ok: true, order: normalizeOrderForResponse(order) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
