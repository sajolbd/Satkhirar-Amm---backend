const bcrypt = require("bcryptjs");

const Product = require("../models/Product");
const User = require("../models/User");
const seedProducts = require("../data/seedProducts");

async function seedDatabase() {
  const productCount = await Product.countDocuments();

  if (productCount === 0) {
    await Product.insertMany(seedProducts);
    console.log(`Seeded ${seedProducts.length} products`);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: process.env.ADMIN_NAME || "Satkhirar Amm Admin",
        email: adminEmail,
        phone: process.env.ADMIN_PHONE || "01700000000",
        passwordHash,
        role: "admin",
        source: "dashboard",
        status: "active",
      },
    },
    {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    }
  );

  console.log(`Admin ready: ${admin.email}`);
}

module.exports = seedDatabase;
