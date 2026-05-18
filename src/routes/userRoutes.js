const bcrypt = require("bcryptjs");
const express = require("express");

const User = require("../models/User");

const router = express.Router();

const PHONE_AUTH_EMAIL_DOMAIN = "phone.satkhirar-amm.local";

function isPhoneAuthEmail(email) {
  return String(email || "").toLowerCase().endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: isPhoneAuthEmail(user.email) ? "" : user.email,
    phone: user.phone,
    role: user.role,
    source: user.source,
    status: user.status,
    joinedAt: user.joinedAt,
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(publicUser));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = req.body;

    if (!payload.name || !payload.email || !payload.phone) {
      return res.status(400).json({ message: "Name, email and phone are required." });
    }

    const update = {
      id: payload.id,
      name: payload.name,
      email: String(payload.email).toLowerCase().trim(),
      phone: payload.phone,
      source: payload.source || "website",
      status: payload.status || "নতুন",
      joinedAt: payload.joinedAt,
    };

    if (payload.password) {
      update.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const user = await User.findOneAndUpdate(
      { email: update.email },
      { $set: update },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );

    res.status(201).json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
