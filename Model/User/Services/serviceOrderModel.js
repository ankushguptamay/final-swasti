import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    learner: { type: Types.ObjectId, ref: "User", required: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: { type: String, enum: ["yogatutorclass"], required: true },
    serviceId: { type: Types.ObjectId },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, unique: true },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    learnerTransactions: [
      {
        type: Types.ObjectId,
        ref: "learnerTransaction",
        required: false,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded", "failed"],
      default: "pending",
    },
    reference: { type: String, unique: true }, // Unique transaction ID
  },
  { timestamps: true }
);

export const ServiceOrder =
  models.ServiceOrder || model("ServiceOrder", schema);
