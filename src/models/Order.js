const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    unit: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      default: "website",
      trim: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true },
      district: { type: String, default: "", trim: true },
      area: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      courierOffice: { type: String, default: "", trim: true },
      note: { type: String, default: "", trim: true },
    },
    items: [orderItemSchema],
    payment: {
      method: { type: String, default: "বিকাশ", trim: true },
      paymentPhone: { type: String, default: "", trim: true },
      transactionId: { type: String, default: "", trim: true },
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      default: "নতুন অর্ডার",
      trim: true,
    },
    date: {
      type: String,
      default: () =>
        new Intl.DateTimeFormat("bn-BD", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Dhaka",
        }).format(new Date()),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.pre("validate", function ensureOrderId(next) {
  if (!this.id) {
    this.id = `SA-${Date.now().toString().slice(-6)}`;
  }

  if (!this.total) {
    this.total = Number(this.subtotal || 0) + Number(this.deliveryCharge || 0);
  }

  next();
});

orderSchema.set("toJSON", {
  transform(_doc, ret) {
    ret._id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
