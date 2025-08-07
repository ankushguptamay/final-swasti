import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String, trim: true },
    videoId: { type: String },
    thumbnail_url: { type: String },
    web_url: { type: String },
    hls_url: { type: String },
    masterYogaCourse: {
      type: Types.ObjectId,
      ref: "MasterYogaCourse",
      required: true,
    },
  },
  { timestamps: true }
);

export const YCReviewVideo =
  models.YCReviewVideo || model("YCReviewVideo", schema);
