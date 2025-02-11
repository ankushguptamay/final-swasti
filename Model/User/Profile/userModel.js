import mongoose from 'mongoose';
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    profilePic: {
      fileName: { type: String },
      url: { type: String },
    },
    language: [],
    dateOfBirth: { type: Date },
    experience_year: { type: Number },
    bio: { type: String },
    role: {
      type: String,
      enum: {
        values: ["instructor", "learner"],
        message: "{VALUE} is not supported",
      },
    },
    userCode: { type: String, unique: true },
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
      gender: { type: String },
      address: { type: String },
    },
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

export const User = models.User || model("User", schema);
