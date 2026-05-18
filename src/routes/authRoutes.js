const bcrypt = require("bcryptjs");
const express = require("express");

const User = require("../models/User");
const signToken = require("../utils/token");

const router = express.Router();

const PHONE_AUTH_EMAIL_DOMAIN = "phone.satkhirar-amm.local";

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function getPhoneAuthEmail(phone) {
  const phoneKey =
    phone.replace(/\D/g, "") ||
    phone.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return `${phoneKey}@${PHONE_AUTH_EMAIL_DOMAIN}`;
}

function isPhoneAuthEmail(email) {
  return String(email || "").endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name === user.phone ? "" : user.name,
    email: isPhoneAuthEmail(user.email) ? "" : user.email,
    phone: user.phone,
    role: user.role,
    source: user.source,
    status: user.status,
    joinedAt: user.joinedAt,
  };
}

router.post("/signup", async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName || !normalizedPhone || !password) {
      return res.status(400).json({ message: "নাম, মোবাইল নম্বর এবং পাসওয়ার্ড দিন।" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user = await User.findOne({ phone: normalizedPhone }).select("+passwordHash");

    if (user?.passwordHash) {
      return res
        .status(409)
        .json({ message: "এই মোবাইল নম্বরে আগে থেকেই অ্যাকাউন্ট আছে।" });
    }

    if (user) {
      user.name = normalizedName;
      user.email = user.email || getPhoneAuthEmail(normalizedPhone);
      user.phone = normalizedPhone;
      user.passwordHash = passwordHash;
      user.source = "website";
      user.status = user.status || "নতুন";
      await user.save();
    } else {
      user = await User.create({
        name: normalizedName,
        email: getPhoneAuthEmail(normalizedPhone),
        phone: normalizedPhone,
        passwordHash,
        source: "website",
        status: "নতুন",
      });
    }

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !password) {
      return res.status(400).json({ message: "মোবাইল নম্বর এবং পাসওয়ার্ড দিন।" });
    }

    const user = await User.findOne({
      phone: normalizedPhone,
    }).select("+passwordHash");

    if (!user?.passwordHash) {
      return res
        .status(401)
        .json({ message: "এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "পাসওয়ার্ড সঠিক নয়।" });
    }

    res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
      role: "admin",
    }).select("+passwordHash");

    if (!user?.passwordHash) {
      return res.status(401).json({ message: "Admin account not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin password." });
    }

    res.json({
      token: signToken(user),
      admin: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
