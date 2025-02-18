import mongoose from 'mongoose';
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    qualificationName: { type: String },
    university_institute: { type: String },
    yearOfCompletion: { type: Date },
    user: { type: Types.ObjectId, ref: "User", required: true },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const Education = models.Education || model("Education", schema);
