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
    startDate: { type: Date }, // when class type
    endDate: { type: Date },
    time: { type: String }, // 24 hours formate
    timeDurationInMin: { type: Number, required: true },
    yogaFor: [], // Child, Adults, Male, Female
    bookedSeat: { type: Number, default: 0 },
    password: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
    // Associations
    transaction: [
      {
        type: Types.ObjectId,
        ref: "UserTransaction",
        required: null,
      },
    ],
    yogaTutorPackage: {
      type: Types.ObjectId,
      ref: "YogaTutorPackage",
      required: true,
    },
    learner: [{ type: Types.ObjectId, ref: "User", default: null }],
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    // Soft delete
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const YogaTutorSlot =
  models.YogaTutorSlot || model("YogaTutorSlot", schema);

const hii = {
  modeOfClass: "online", // Page 1
  classType: "individual", // Page 2
  packageId: "dfbufis", // page 3, In customisePackage and packageId only one is required. If both are present then packageId should be prioritize and cuntomisePackage assumed to be null. If classType is individual then individual_price field is required, if in selected package individual_price is not presnet then one additional field will open to same page to enter individual_price. when instructor will add this field then all existing field in the package will be unchangable
  customisePackage: {
    numberOfDays: 1,
    packageName: "ohhhho ek din me zero figure.",
    individual_price: 600,
  }, // Page 4
  times: [
    {
      time: "11:00",
      timeDurationInMin: 60,
    },
    {
      time: "12:00",
      timeDurationInMin: 60,
    },
    {
      time: "16:00",
      timeDurationInMin: 30,
    },
    {
      time: "16:30",
      timeDurationInMin: 30,
    },
  ], // Page 5
};
