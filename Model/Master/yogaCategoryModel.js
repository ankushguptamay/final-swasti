import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    image: {
      fileName: { type: String },
      url: { type: String },
    },
    yogaCategory: { type: String, required: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String },
    tags: [String], // extra keywords for better search
    embedding: { type: [Number] }, // vector (array of floats)
  },
  { timestamps: true }
);
// Generate Slug
schema.pre("save", function (next) {
  if (!this.isModified("yogaCategory")) return next();
  this.slug = slugify(this.yogaCategory, { lower: true });
  next();
});
export const YogaCategory =
  models.YogaCategory || model("YogaCategory", schema);
