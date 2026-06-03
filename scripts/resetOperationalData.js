require("../src/config/env");

const connectDB = require("../src/config/db");
const Order = require("../src/models/Order");

async function resetOperationalData() {
  await connectDB();

  const result = await Order.deleteMany({});
  console.log(`Deleted ${result.deletedCount} orders. Users and products were kept.`);
}

resetOperationalData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
