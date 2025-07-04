import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models } = mongoose;

// Define the schema
const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);
// Generate Slug
schema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  this.slug = slugify(this.name, { lower: true });
  next();
});
// Create the model using the schema
export const BlogTag = models.BlogTag || model("BlogTag", schema);
