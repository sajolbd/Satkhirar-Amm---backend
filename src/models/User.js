const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      trim: true,
    },
    source: {
      type: String,
      default: "website",
      trim: true,
    },
    status: {
      type: String,
      default: "নতুন",
      trim: true,
    },
    joinedAt: {
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

userSchema.pre("validate", function ensurePublicId(next) {
  if (!this.id) {
    const random = Math.floor(Math.random() * 900 + 100);
    this.id = `USR-${Date.now().toString().slice(-6)}${random}`;
  }

  next();
});

userSchema.set("toJSON", {
  transform(_doc, ret) {
    ret._id = ret._id.toString();
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
