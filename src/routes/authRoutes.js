const bcrypt = require("bcryptjs");
const express = require("express");

const User = require("../models/User");
const signToken = require("../utils/token");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    source: user.source,
    status: user.status,
    joinedAt: user.joinedAt,
  };
}

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "সব তথ্য পূরণ করুন।" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "পাসওয়ার্ড মিলছে না।" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (user?.passwordHash) {
      return res
        .status(409)
        .json({ message: "এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে।" });
    }

    if (user) {
      user.name = name;
      user.phone = phone;
      user.passwordHash = passwordHash;
      user.source = "website";
      user.status = user.status || "নতুন";
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        phone,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "ইমেইল এবং পাসওয়ার্ড দিন।" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    }).select("+passwordHash");

    if (!user?.passwordHash) {
      return res
        .status(401)
        .json({ message: "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" });
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
