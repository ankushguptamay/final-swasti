import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

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
    startDate: { type: Date },
    endDate: { type: Date }, // Full date time
    timeDurationInMin: { type: Number, required: true },
    yogaCategory: [{ type: Types.ObjectId, ref: "YogaCategory" }],
    bookedSeat: { type: Number, default: 0 },
    learnerMessage: { type: String, required: true },
    // For Booking Purpose
    password: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
    // Time Zone
    instructorTimeZone: { type: String },
    meetingLink: { type: String },
    // Associations
    yTRule: [{ type: Types.ObjectId, ref: "YogaTutorRule" }],
    yTRequirement: [{ type: Types.ObjectId, ref: "YogaTutorRequirement" }],
    serviceOrder: [
      {
        type: Types.ObjectId,
        ref: "ServiceOrder",
        required: false,
      },
    ],
    yogaTutorPackage: {
      type: Types.ObjectId,
      ref: "YogaTutorPackage",
      required: true,
    },
    yogaTutorClass: {
      type: Types.ObjectId,
      ref: "YogaTutorClass",
      required: true,
    },
    learner: [{ type: Types.ObjectId, ref: "User" }], // Note.1.
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    // Soft delete
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const YTClassSlot = models.YTClassSlot || model("YTClassSlot", schema);

// Note.1.
// If class is for individual and only one learner, And If group more then one can be possible
