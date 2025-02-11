import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const Admin = models.Admin || model("Admin", schema);
