import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    accountNumber: { type: Number },
    bankName: { type: String },
    branch: { type: String },
    IFSCCode: { type: String },
    user: { type: Types.ObjectId, ref: "User", required: true },
    isVerified: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const BankDetail = models.BankDetail || model("BankDetail", schema);
