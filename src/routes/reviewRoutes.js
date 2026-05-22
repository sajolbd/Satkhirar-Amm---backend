const express = require("express");

const Review = require("../models/Review");

const router = express.Router();

function normalizeReviewPayload(payload = {}) {
  const rating = Math.min(5, Math.max(1, Number(payload.rating || 5)));
  const media =
    payload.media?.url && ["image", "video"].includes(payload.media?.type)
      ? {
          type: payload.media.type,
          url: payload.media.url,
          name: payload.media.name || "",
          contentType: payload.media.contentType || "",
          size: Number(payload.media.size || 0),
        }
      : undefined;

  return {
    id: payload.id,
    name: payload.name,
    phone: payload.phone || "",
    location: payload.location || "",
    title: payload.title || "",
    message: payload.message,
    rating,
    media,
    status: payload.status || "pending",
    source: payload.source || "website",
    date: payload.date,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.published === "true") {
      filter.status = "published";
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = normalizeReviewPayload(req.body);

    if (!payload.name || !payload.message) {
      return res.status(400).json({ message: "Name and review message are required." });
    }

    const review = await Review.create(payload);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const payload = normalizeReviewPayload(req.body);
    const shouldUnsetMedia =
      Object.prototype.hasOwnProperty.call(req.body, "media") && !payload.media;

    if (!payload.name || !payload.message) {
      return res.status(400).json({ message: "Name and review message are required." });
    }

    if (!payload.id) {
      delete payload.id;
    }

    if (!payload.date) {
      delete payload.date;
    }

    if (!payload.media) {
      delete payload.media;
    }

    const review = await Review.findOneAndUpdate(
      { id: req.params.id },
      shouldUnsetMedia ? { $set: payload, $unset: { media: "" } } : { $set: payload },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const review = await Review.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ id: req.params.id });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.json({ ok: true, review });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
