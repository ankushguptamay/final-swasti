import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    rule: { type: String, required: true },
  },
  { timestamps: true }
);

export const YogaTutorRule =
  models.YogaTutorRule || model("YogaTutorRule", schema);
