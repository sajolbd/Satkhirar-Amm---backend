require("../src/config/env");

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

async function resetProducts() {
  await connectDB();

  const result = await Product.deleteMany({});
  console.log(
    `Deleted ${result.deletedCount} products. They will be re-seeded on next backend start.`,
  );
}

resetProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
