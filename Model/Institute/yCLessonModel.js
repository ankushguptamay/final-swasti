import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

// Define the schema
const schema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    video: { type: String, required: false },
    hls_url: { type: String, required: false },
    videoTimeInMinute: { type: Number, default: 60 },
    thumbNailUrl: { type: String, required: false },
    yogaCourse: { type: Types.ObjectId, ref: "YogaCourse", required: true },
  },
  { timestamps: true }
);

// Create the model using the schema
export const YCLesson = models.YCLesson || model("YCLesson", schema);
