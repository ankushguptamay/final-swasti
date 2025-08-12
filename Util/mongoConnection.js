import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { YogaCourse } from "../Model/Institute/yCBatchMode.js";
import { MasterYogaCourse } from "../Model/Master/yogaCousreModel.js";
import { YOGACOURSE } from "../Config/class.const.js";
import { YCLesson } from "../Model/Institute/yCLessonModel.js";

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME });
    console.log("Database Connected successfully!");
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
};

// Drop the entire database put it at line 8
// await mongoose.connection.db.dropDatabase();
// console.log("Database dropped");

async function addBrevoEmail() {
  await EmailCredential.create({ email: "connect@swastibharat.com" });
}

async function changeLessonVideo() {
  try {
    const yogaCourse = YOGACOURSE;
    for (let i = 0; i < yogaCourse.length; i++) {
      const course = await MasterYogaCourse.findOne({
        title: yogaCourse[i],
      }).lean();
      if (!course) {
        await MasterYogaCourse.create({ title: yogaCourse[i] });
      }
    }
    const lesson = await YCLesson.find({
      video: { $exists: true },
      yogaCourse: { $ne: "688a107e7811309aa986bc59" },
    }).lean();
    for (let i = 0; i < lesson.length; i++) {
      const arr = lesson[i].video.split("/");
      const video_id = arr[arr.length - 1];
      await YCLesson.updateOne({ _id: lesson[i]._id }, { $set: { video_id } });
    }
    console.log("Done.");
  } catch (err) {
    console.error("Error updating start dates:", err);
  }
}

export { connectDB, addBrevoEmail, changeLessonVideo };
