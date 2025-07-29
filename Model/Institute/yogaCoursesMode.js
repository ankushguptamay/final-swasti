import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model, models, Types } = mongoose;

const course = ["Yoga Volunteer Course"];

// Define the schema
const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      enum: {
        values: course,
        message: "{VALUE} is not supported",
      },
    },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
    batchNumber: { type: Number, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    totalEnroll: { type: Number, default: 0 },
    assigned_to: {
      type: Types.ObjectId,
      ref: "InstituteInstructor",
      required: false,
    },
  },
  { timestamps: true }
);

// Ensure uniqueness of slug globally
schema.index({ slug: 1 }, { unique: true });

// Pre-save hook for batchNumber and slug
schema.pre("save", async function (next) {
  const doc = this;

  if (doc.isNew) {
    // Count how many existing batches exist with the same course name
    const count = await mongoose.models.YogaCourse.countDocuments({
      name: doc.name,
    });
    // Next batch number for this course name
    doc.batchNumber = count + 1;

    // Generate slug as "name-batchNumber"
    const baseSlug = slugify(doc.name, { lower: true });
    doc.slug = `${baseSlug}-${doc.batchNumber}`;
  }

  next();
});

// Create the model using the schema
export const YogaCourse = models.YogaCourse || model("YogaCourse", schema);
