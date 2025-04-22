import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    wallet: { type: Types.ObjectId, ref: "Wallet", required: true },
    serviceOrder: { type: Types.ObjectId, ref: "ServiceOrder" },
    user: { type: Types.ObjectId, ref: "User", required: true },
    // Amount
    amount: { type: Number },
    amountWithdrawed: { type: Number, default: 0 },
    withDrawDone: { type: Boolean, default: false },
    // Payment
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    reference: { type: String }, // Unique transaction ID
    paymentType: { type: String, enum: ["debit", "credit"], required: true },
    reason: {
      type: String,
      enum: ["servicebooked", "servicecancelled", "withdraw"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded", "failed"],
      default: "pending",
    },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const UserTransaction =
  models.UserTransaction || model("UserTransaction", schema);
