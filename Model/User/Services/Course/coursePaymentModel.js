// This is not main model. This is valid unlit course schema is not define.
// After course schema all data will move in serviceOrder Schema

import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    learner: { type: Types.ObjectId, ref: "User", required: true },
    courseName: { type: String },
    couponName: { type: String },
    amount: { type: Number, required: true }, // Total amount in rupee
    startDate: { type: Date },
    numberOfBooking: { type: Number, default: 1 }, // Booking for how many pepole like as learner can book for many people
    paymentMethod: {
      type: String,
      enum: ["razorpay", "phonepe"],
      required: true,
    },
    razorpayDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },
    phonepeDetails: {
      transactionId: String, // PhonePe transaction ID
      orderId: String, // order ID from PhonePe
      response: mongoose.Schema.Types.Mixed, // raw PhonePe response if needed
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded", "failed"],
      default: "pending",
    },
    verify: { type: Boolean, default: false },
    receipt: { type: String, unique: true }, // Unique transaction ID
  },
  { timestamps: true }
);

export const CoursePayment =
  models.CoursePayment || model("CoursePayment", schema);
