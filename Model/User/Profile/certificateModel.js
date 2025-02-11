import mongoose from 'mongoose';
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    name: { type: String },
    image: {
      fileName: { type: String },
      url: { type: String },
    },
    user: { type: Types.ObjectId, ref: "User", required: true },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

export const Certificate = models.Certificate || model("Certificate", schema);
