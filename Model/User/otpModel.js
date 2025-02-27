import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema({
  otp: { type: Number },
  validTill: { type: String },
  receiverId: { type: Types.ObjectId, ref: "User", required: true },
});

export const OTP = models.OTP || model("OTP", schema);
