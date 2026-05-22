const mongoose = require("mongoose");

const reviewMediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    contentType: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    media: {
      type: reviewMediaSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["pending", "published", "hidden"],
      default: "pending",
      trim: true,
    },
    source: {
      type: String,
      default: "website",
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

reviewSchema.pre("validate", function ensureReviewId(next) {
  if (!this.id) {
    const random = Math.floor(Math.random() * 900 + 100);
    this.id = `REV-${Date.now().toString().slice(-6)}${random}`;
  }

  next();
});

reviewSchema.set("toJSON", {
  transform(_doc, ret) {
    ret._id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("Review", reviewSchema);
