import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    deviceToken: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ["windows", "mac", "linux", "android", "ios"],
      required: true,
    },
    deviceId: { type: String }, // Unique for each mobile device
    browserInfo: { type: String }, // Unique for each browser (only for web)
    firstLoginDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const UserDevice = models.UserDevice || model("UserDevice", schema);
