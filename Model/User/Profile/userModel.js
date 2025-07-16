import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;
import slugify from "slugify";

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    profilePic: {
      fileName: { type: String },
      url: { type: String },
    },
    language: [],
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "{VALUE} is not supported",
      },
    },
    experience_year: { type: Number },
    bio: { type: String },
    role: {
      type: String,
      enum: {
        values: ["instructor", "learner"],
        message: "{VALUE} is not supported",
      },
    },
    userCode: { type: String },
    referralCode: { type: String },
    chakraBreakNumber: { type: Number },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (value) => Math.round(value * 10) / 10, // Rounds to 1 decimal place
    },
    lastLogin: { type: Date, default: Date.now },
    // Aadhar
    isAadharVerified: { type: Boolean, default: false },
    aadharDetails: {
      aadharNumber: { type: String },
      name: { type: String },
      dateOfBirth: { type: String },
      address: { type: String },
      gender: { type: String },
    },
    userTimeZone: { type: String, default: "Asia/Kolkata" },
    term_condition_accepted: { type: Boolean, default: false },
    // Children Table
    bankDetail: [{ type: Types.ObjectId, ref: "BankDetail" }],
    education: [{ type: Types.ObjectId, ref: "Education" }],
    certificate: [{ type: Types.ObjectId, ref: "Certificate" }],
    specialization: [{ type: Types.ObjectId, ref: "Specialization" }],
    // Other record
    isProfileVisible: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isMobileNumberVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);
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
    const usersWithSameBase = await mongoose.models.User.find({
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

export const User = models.User || model("User", schema);
