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
    packageType: {
      type: String,
      enum: {
        values: ["weekly", "daily", "monthly"],
        message: "{VALUE} is not supported",
      },
      default: "daily",
    },
    numberOfClass: { type: Number, default: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    time: { type: String }, // 24 hours formate
    timeDurationInMin: { type: Number, required: true },
    datesOfClasses: [
      { type: Types.ObjectId, ref: "YTClassDate", required: true },
    ],
    price: { type: Number, required: true }, // price for all class combined per person
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
    numberOfSeats: { type: Number, default: 1 },
    // For Booking Purpose
    instructorTimeZone: { type: String }, // Note 1.
    isBooked: { type: Boolean, default: false },
    totalBookedSeat: { type: Number, default: 0 },
    // Associations
    yogaCategory: [{ type: Types.ObjectId, ref: "YogaCategory" }],
    yTRule: [{ type: Types.ObjectId, ref: "YogaTutorRule" }],
    yTRequirement: [{ type: Types.ObjectId, ref: "YogaTutorRequirement" }],
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    serviceOrder: [{ type: Types.ObjectId, ref: "ServiceOrder" }],
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

// const data = {
//   modeOfClass: "online",
//   classType: "group",
//   time: "16:00",
//   timeDurationInMin: 30,
//   startDate: "2025-04-04",
//   packageType: "Weekly",
//   numberOfClass: 4,
//   description:"",
//   price: 4000,
//   datesOfClasses: ["2025-04-04", "2025-04-06", "2025-04-07", "2025-04-09"],
//   endDate: "2025-04-09",
//   numberOfSeats: 10,
//   yogaCategory: [],
//   yTRule: [],
//   yTRequirement: [],
// };
