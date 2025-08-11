import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    otp: { type: Number },
    validTill: { type: String },
    receiverId: { type: Types.ObjectId },
  },
  { timestamps: true }
);

export const InstituteOTP =
  models.InstituteOTP || model("InstituteOTP", schema);
