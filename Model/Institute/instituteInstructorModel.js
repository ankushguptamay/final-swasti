import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;
import slugify from "slugify";

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    slug: { type: String, unique: true, trim: true },
    institute: { type: Types.ObjectId, ref: "Institute", required: true },
    instructor: { type: Types.ObjectId, ref: "User", required: false },
    // Approval
    approvalByAdmin: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected"],
        message: "{VALUE} is not supported",
      },
      default: "pending",
    },
    refreshToken: { type: String },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

// Slug
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
    const usersWithSameBase = await mongoose.models.InstituteInstructor.find({
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

export const InstituteInstructor =
  models.InstituteInstructor || model("InstituteInstructor", schema);
