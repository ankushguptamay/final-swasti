import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    packageName: { type: String },
    group_price: { type: Number },
    individual_price: { type: Number },
    numberOfDays: { type: Number },
    parentPackage: {
      type: Types.ObjectId,
      ref: "YogaTutorPackage",
      required: true,
    },
  },
  { timestamps: true }
);

export const YogaTutorPackageHistory =
  models.YogaTutorPackageHistory || model("YogaTutorPackageHistory", schema);
