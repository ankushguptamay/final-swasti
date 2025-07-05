import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models, Types } = mongoose;

// Define the schema
const schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory" }],
    tag: [{ type: String }],
    subCategory: [{ type: String }],
    content: { type: String },
    excerpt: { type: String },
    featuredPic: {
      fileName: { type: String },
      url: { type: String },
    },
    additionalPic: [
      {
        fileName: { type: String },
        url: { type: String },
      },
    ],
    readTime: { type: String },
    publishDate: { type: Date, default: new Date() },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: {
        values: ["Draft", "Published", "Unpublish"],
      },
      default: "Draft",
    },
  },
  { timestamps: true }
);
// Indexing
schema.index({
  title: "text",
  content: "text",
  description: "text",
  // subCategory: 1,
  // tag: 1,
});
// Generate Slug
schema.pre("save", function (next) {
  if (!this.isModified("title")) return next();
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Create the model using the schema
export const Blog = models.Blog || model("Blog", schema);
