import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    country: { type: String },
    title: { type: String },
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    nationality: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    spouseName: { type: String },
    category: { type: String },
    pwd_certificate: { type: String },
    typeOfPhotoId: { type: String },
    id_number: { type: String },
    id_image: {
      fileName: { type: String },
      url: { type: String },
    },
    contactNumber: { type: String },
    face_pic: {
      fileName: { type: String },
      url: { type: String },
    },
    correspondenseAddress: {
      address: { type: String },
      state: { type: String },
      district: { type: String },
      pinCode: { type: Number },
    },
    permanentAddress: {
      address: { type: String },
      country: { type: String },
      state: { type: String },
      district: { type: String },
      pinCode: { type: Number },
    },
    email: { type: String },
    learner: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const YCBRegistrationForm =
  models.YCBRegistrationForm || model("YCBRegistrationForm", schema);
