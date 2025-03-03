import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    yogaCategory: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const YogaCategory =
  models.YogaCategory || model("YogaCategory", schema);
