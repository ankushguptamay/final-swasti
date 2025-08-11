import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import slugify from "slugify";

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, trim: true },
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

// Generate Slug
schema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  this.slug = slugify(this.name, { lower: true });
  next();
});

export const Institute = models.Institute || model("Institute", schema);
