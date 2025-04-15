import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    title: { type: String, required: true },
    redirectLink: { type: String },
    bannerImage: {
      fileName: { type: String },
      url: { type: String },
    },
  },
  { timestamps: true }
);

export const Banner = models.Banner || model("Banner", schema);
