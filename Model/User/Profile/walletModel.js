import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wallet per user
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: { type: String, required: true, default: "INR" },
    transactions: [{ type: Types.ObjectId, ref: "Transaction" }],
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Wallet = models.Wallet || model("Wallet", schema);
