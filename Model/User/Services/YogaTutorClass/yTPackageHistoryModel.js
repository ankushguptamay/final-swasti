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

schema.pre("find", function () {
  this.where({ isDelete: false });
});

export const YogaTutorPackageHistory =
  models.YogaTutorPackageHistory || model("YogaTutorPackageHistory", schema);
