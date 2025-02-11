import mongoose from 'mongoose';
const { Schema, model, models, Types } = mongoose;

const schema = new Schema(
  {
    chakraName: {
      type: String,
      enum: {
        values: [
          "Root",
          "Sacral",
          "Solar Plexus",
          "Heart",
          "Throat",
          "Third Eye",
          "Crown",
        ],
        message: "{VALUE} is not supported",
      },
    },
    chakraNumber: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, 5, 6, 7],
        message: "{VALUE} is not supported",
      },
    },
    joiner: { type: Types.ObjectId, ref: "User", required: true },
    referrer: { type: Types.ObjectId, ref: "User", required: true },
    isRedeemed: { type: Boolean, default: false },
    redeemed_at: { type: Date },
  },
  { timestamps: true }
);

export const UserChakras = models.UserChakras || model("UserChakras", schema);
