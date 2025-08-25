import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

// This is yoga tutor table. All filter applt of this table. When user book any slot then we create new slote on yogaTutorSlot model with the help of this table.
const schema = new Schema(
  {
    startDateTimeUTC: { type: Date },
    endDateTimeUTC: { type: Date },
    date: { type: Date },
    joinedBy: [{ type: Types.ObjectId, ref: "User" }],
    password: { type: Number, required: true },
    classStatus: {
      type: String,
      enum: {
        values: ["upcoming", "completed", "missed"],
        message: "{VALUE} is not supported",
      },
    },
    yogaTutorClass: {
      type: Types.ObjectId,
      ref: "YogaTutorClass",
      required: true,
    },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const YTClassDate = models.YTClassDate || model("YTClassDate", schema);
