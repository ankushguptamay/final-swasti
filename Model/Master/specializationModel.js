import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    specialization: { type: String },
  },
  { timestamps: true }
);

export const Specialization =
  models.Specialization || model("Specialization", schema);
