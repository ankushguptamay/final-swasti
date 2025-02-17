import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    profilePic: {
      fileName: { type: String },
      url: { type: String },
    },
    language: [],
    dateOfBirth: { type: Date },
    gender: { type: String },
    experience_year: { type: Number },
    bio: { type: String },
    lastLogin: { type: Date },
    // Other record
    isProfileVisible: { type: Boolean },
    isEmailVerified: { type: Boolean },
    isMobileNumberVerified: { type: Boolean },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const InstructorUpdateHistory =
  models.InstructorUpdateHistory || model("InstructorUpdateHistory", schema);

// This record create here only when instructor profile is published
// When instructor change his profile then one record create here of which, data is changed in main profile and and main profile changed
