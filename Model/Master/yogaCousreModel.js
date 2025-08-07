import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models, Types } = mongoose;

const course = ["Yoga Volunteer Course"];

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: {
        values: course,
        message: "{VALUE} is not supported",
      },
    },
    time_hours: { type: Number, required: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
    image: {
      fileName: { type: String },
      url: { type: String },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (value) => Math.round(value * 10) / 10, // Rounds to 1 decimal place
    },
    descriptive_video: {
      videoId: { type: String },
      thumbnail_url: { type: String },
      web_url: { type: String },
      hls_url: { type: String },
    },
  },
  { timestamps: true }
);
// Generate Slug
schema.pre("save", function (next) {
  if (!this.isModified("title")) return next();
  this.slug = slugify(this.title, { lower: true });
  next();
});
export const MasterYogaCourse =
  models.MasterYogaCourse || model("MasterYogaCourse", schema);
