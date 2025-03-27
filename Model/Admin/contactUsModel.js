import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    mobileNumber: { type: String },
    message: { type: String },
    contactUsCode: { type: String },
    user: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ContactUs = models.ContactUs || model("ContactUs", schema);
