import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    requirement: { type: String, required: true }
  },
  { timestamps: true }
);

export const YogaTutorRequirement =
  models.YogaTutorRequirement || model("YogaTutorRequirement", schema);
