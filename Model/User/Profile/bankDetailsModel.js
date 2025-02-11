import mongoose from 'mongoose';
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    accountNumber: { type: Number },
    branch: { type: String },
    IFSCCode: { type: String },
    user: { type: Types.ObjectId, ref: "User", required: true },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const BankDetail = models.BankDetail || model("BankDetail", schema);
