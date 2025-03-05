import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

// This is yoga tutor table. All filter applt of this table. When user book any slot then we create new slote on yogaTutorSlot model with the help of this table.
const schema = new Schema(
  {
    modeOfClass: {
      type: String,
      enum: {
        values: ["online", "offline-learners-place", "offline-tutors-place"],
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    classType: {
      type: String,
      enum: {
        values: ["individual", "group"],
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    className: { type: String, required: true },
    publishedDate: { type: Date }, // From when this yoga tutor class open for public YYYY-MM-DD
    unPublishDate: { type: Date }, // Note 2.
    time: { type: String }, // 24 hours formate
    timeDurationInMin: { type: Number, required: true },
    description: { type: String },
    // Approval
    approvalByAdmin: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected"],
        message: "{VALUE} is not supported",
      },
      default: "pending",
    },
    anyApprovalRequest: { type: Boolean, default: true },
    // Associations
    yogaCategory: [{ type: Types.ObjectId, ref: "YogaCategory" }],
    userTimeZone: { type: String }, // Note 1.
    yogaTutorPackage: {
      type: Types.ObjectId,
      ref: "YogaTutorPackage",
      required: true,
    },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    // Soft delete
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const YogaTutorClass =
  models.YogaTutorClass || model("YogaTutorClass", schema);

// Note 1.
// This will come from instructor profile.
// If instructor change there location and if want to update there location then new timezone apply only on new class.
// Previously created class will oprate according to their previous timezone.
// If he want to change their timeZone also for their existing, onging class. Then he can set unPublish date and create new class at same time

// Note 2.
// Instructor can stop taking new appointment on this slot form this date. default value is null.
//  if this value is present then this slot is unpublished for general user
