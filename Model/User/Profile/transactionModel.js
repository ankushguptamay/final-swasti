import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    // wallet: {
    //   type: Types.ObjectId,
    //   ref: "Wallet",
    //   required: true,
    // },
    // instructor: {
    //   type: Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const UserTransaction =
  models.UserTransaction || model("UserTransaction", schema);
