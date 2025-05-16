import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    image: {
      fileName: { type: String },
      url: { type: String },
    },
    yogaCategory: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const YogaCategory =
  models.YogaCategory || model("YogaCategory", schema);
