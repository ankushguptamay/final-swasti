import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    user: {
      type: Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

export const UserDeleteRequestPlayStore =
  models.UserDeleteRequestPlayStore || model("UserDeleteRequestPlayStore", schema);
