import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models, Types } = mongoose;

// Define the schema
const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
    image: { fileName: { type: String }, url: { type: String } },
    parentCategory: {
      type: Types.ObjectId,
      ref: "BlogCategory",
    },
  },
  { timestamps: true }
);

// Generate Slug
function numberToAlpha(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  do {
    result = chars[n % 26] + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

schema.pre("save", async function (next) {
  if (this.isModified("name") || !this.slug) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });

    // Find existing slugs with the same base
    const regex = new RegExp(`^${baseSlug}-[a-z]+$`);
    const usersWithSameBase = await mongoose.models.BlogSubCategory.find({
      slug: regex,
    }).select("slug");

    // Extract suffixes and calculate the next one
    const suffixes = usersWithSameBase.map((u) =>
      u.slug.replace(`${baseSlug}-`, "")
    );
    let index = 0;
    while (suffixes.includes(numberToAlpha(index))) {
      index++;
    }

    const suffix = numberToAlpha(index);
    this.slug = `${baseSlug}-${suffix}`;
  }
  next();
});

// Create the model using the schema
export const BlogSubCategory =
  models.BlogSubCategory || model("BlogSubCategory", schema);
