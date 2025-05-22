import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    user: { type: Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

export const SubscribedUser =
  models.SubscribedUser || model("SubscribedUser", schema);
