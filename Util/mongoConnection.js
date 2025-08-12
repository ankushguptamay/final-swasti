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
    await MasterYogaCourse.updateOne(
      { title: "Yoga Volunteer Course" },
      { $set: { amount: 1500 } }
    );
    await MasterYogaCourse.updateOne(
      { title: "Yoga Wellness Instructor" },
      { $set: { amount: 18000 } }
    );
    console.log("Done.");
  } catch (err) {
    console.error("Error updating start dates:", err);
  }
}

export { connectDB, addBrevoEmail, changeLessonVideo };
