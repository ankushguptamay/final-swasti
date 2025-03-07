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
    startDate: { type: Date }, // In individual classType start date and end date learner will decide, and in group start date will be decided by instructor. And also in group class type when if package is perDay then only start time is required
    endDate: { type: Date }, // Full date time
    timeDurationInMin: { type: Number, required: true },
    yogaFor: [], // Child, Adults, Male, Female
    bookedSeat: { type: Number, default: 0 },
    password: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
    // Associations
    specialization: [{ type: Types.ObjectId, ref: "Specialization" }],
    transaction: [
      {
        type: Types.ObjectId,
        ref: "UserTransaction",
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
    learner: [{ type: Types.ObjectId, ref: "User" }],
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    // Soft delete
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const YogaTutorSlot =
  models.YogaTutorSlot || model("YogaTutorSlot", schema);
