import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 }, // star Rating
    message: { type: String },
    learner: { type: Types.ObjectId, ref: "User", required: true },
    masterYC: { type: Types.ObjectId, ref: "MasterYogaCourse", required: true }
  },
  { timestamps: true }
);

export const YogaCourseReview =
  models.YogaCourseReview || model("YogaCourseReview", schema);
