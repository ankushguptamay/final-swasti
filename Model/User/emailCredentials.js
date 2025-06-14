import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    emailSend: { type: Number, default: 0 },
    EMAIL_API_KEY: { type: String, default: null },
    email: { type: String, unique: true },
  },
  { timestamps: true }
);

export const EmailCredential =
  models.EmailCredential || model("EmailCredential", schema);
