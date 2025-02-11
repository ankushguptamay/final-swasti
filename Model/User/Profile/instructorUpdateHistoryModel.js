import { Schema, model, models, Types } from "mongoose";

const schema = new Schema(
  {
    name: { type: String },
    profilePic: {
      fileName: { type: String },
      url: { type: String },
    },
    language: [],
    dateOfBirth: { type: Date },
    experience_year: { type: Number },
    bio: { type: String },
    lastLogin: { type: Date },
    // Other record
    isProfileVisible: { type: Boolean },
    isEmailVerified: { type: Boolean },
    isMobileNumberVerified: { type: Boolean },
    user: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const InstructorUpdateHistory =
  models.InstructorUpdateHistory || model("InstructorUpdateHistory", schema);

// This record create here only when instructor profile is published
// When instructor change his profile then one record create here of which, data is changed in main profile and and main profile changed
