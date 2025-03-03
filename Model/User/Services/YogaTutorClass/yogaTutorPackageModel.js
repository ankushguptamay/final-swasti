import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    packageType: {
      type: String,
      enum: {
        values: ["individual", "group"],
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    packageName: { type: String, required: true },
    group_price: { type: Number, default: null }, // price for all given days combined per person
    individual_price: { type: Number, default: null }, // price for all given days combined per person
    numberOfDays: { type: Number, required: true },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const YogaTutorPackage =
  models.YogaTutorPackage || model("YogaTutorPackage", schema);