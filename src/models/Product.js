const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "আম",
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountLabel: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    shortNote: {
      type: String,
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      default: "স্টক আছে",
      trim: true,
    },
    color: {
      type: String,
      default: "from-orange-300 to-amber-500",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 999,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

productSchema.set("toJSON", {
  transform(_doc, ret) {
    ret._id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
