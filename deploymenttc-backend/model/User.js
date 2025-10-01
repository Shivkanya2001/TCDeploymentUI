// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["admin", "operator", "user"],
      index: true,
    },
    orgId: { type: String, required: true, trim: true, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// If you need multi-tenant uniqueness (optional):
// userSchema.index({ orgId: 1, email: 1 }, { unique: true });

export default mongoose.model("User", userSchema, "users");
