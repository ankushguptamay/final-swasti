import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

// In this when user is tring to change className or description then it will go through admin approval
const schema = new Schema(
  {
    price: { type: Number },
    yogaCategory: [{ type: Types.ObjectId, ref: "YogaCategory" }],
    yogaTutorClass: {
      type: Types.ObjectId,
      ref: "YogaTutorClass",
      required: true,
    },
    yTRule: [{ type: Types.ObjectId, ref: "YogaTutorRule" }],
    yTRequirement: [{ type: Types.ObjectId, ref: "YogaTutorRequirement" }],
  },
  { timestamps: true }
);

export const YTClassUpdateHistory =
  models.YTClassUpdateHistory || model("YTClassUpdateHistory", schema);
