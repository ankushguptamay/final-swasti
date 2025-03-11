import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

// In this when user is tring to change className or description then it will go through admin approval
const schema = new Schema(
  {
    className: { type: String },
    description: { type: String },
    // Approval
    approvalByAdmin: {  type: String,
        enum: {
          values: ["pending", "accepted", "rejected"],
          message: "{VALUE} is not supported",
        },
        default: "pending", },
    // Associations
    yogaCategory: [{ type: Types.ObjectId, ref: "YogaCategory" }],
    yogaTutorPackage: {
      type: Types.ObjectId,
      ref: "YogaTutorPackage",
    },
    yogaTutorClass: [
      { type: Types.ObjectId, ref: "YogaTutorClass", required: true },
    ],
  },
  { timestamps: true }
);

export const YTClassUpdateHistory =
  models.YTClassUpdateHistory || model("YTClassUpdateHistory", schema);
