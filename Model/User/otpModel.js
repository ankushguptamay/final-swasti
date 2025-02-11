import { Schema, model, models, Types } from "mongoose";

const schema = new Schema({
  otp: { type: Number },
  validTill: { type: String },
  receiverId: { type: Types.ObjectId, ref: "User", required: true },
});

export const OTP = models.OTP || model("otp", schema);
