import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models } = mongoose;

// Define the schema
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
    image: {
      fileName: { type: String },
      url: { type: String },
    },
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
export const BlogCategory =
  models.BlogCategory || model("BlogCategory", schema);
