import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    learner: { type: Types.ObjectId, ref: "User", required: true },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    service: { type: String, enum: ["yogatutorclass"], required: true },
    serviceId: { type: Types.ObjectId },
    amount: { type: Number, required: true }, // Total amount
    numberOfBooking: { type: Number, default: 1 }, // Booking for how many pepole like as learner can book for many people
    razorpayOrderId: { type: String, unique: true },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    learnerTransactions: [{ type: Types.ObjectId, ref: "learnerTransaction" }], // THis field added for only cancellation purpose when learner will cancelled then a wallet transaction will done
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded", "failed"],
      default: "pending",
    },
    receipt: { type: String, unique: true }, // Unique transaction ID
  },
  { timestamps: true }
);

export const ServiceOrder =
  models.ServiceOrder || model("ServiceOrder", schema);
