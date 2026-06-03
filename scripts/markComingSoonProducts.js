require("../src/config/env");

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

const AVAILABLE_PRODUCT_ID = "himsagar";
const COMING_SOON_STATUS = "শীঘ্রই আসছে";
const AVAILABLE_STATUS = "স্টক আছে";

async function markComingSoonProducts() {
  await connectDB();

  const availableResult = await Product.updateOne(
    { id: AVAILABLE_PRODUCT_ID },
    {
      $set: {
        status: AVAILABLE_STATUS,
        isActive: true,
        isFeatured: true,
      },
    }
  );

  const comingSoonResult = await Product.updateMany(
    { id: { $ne: AVAILABLE_PRODUCT_ID } },
    { $set: { status: COMING_SOON_STATUS } }
  );

  console.log(
    `Updated ${availableResult.modifiedCount} available product and ${comingSoonResult.modifiedCount} coming-soon products.`
  );
}

markComingSoonProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
