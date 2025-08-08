import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { CoursePayment } from "../Model/User/Services/Course/coursePaymentModel.js";
import { YogaCourse } from "../Model/Institute/yCBatchMode.js";
import axios from "axios";
import { MasterYogaCourse } from "../Model/Master/yogaCousreModel.js";

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

async function associateMasterCousreWithBatch() {
  try {
    const course = await MasterYogaCourse.findOneAndUpdate(
      { title: "Yoga Volunteer Course" },
      { updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const batch = await YogaCourse.find({
      name: "Yoga Volunteer Course",
      masterYC: { $exists: false },
    })
      .select("_id")
      .lean();
    for (let i = 0; i < batch.length; i++) {
      await YogaCourse.updateOne(
        { _id: batch[i]._id },
        { $set: { masterYC: course._id } }
      );
    }
    console.log("Done.");
  } catch (err) {
    console.error("Error updating start dates:", err);
  }
}

export { connectDB, addBrevoEmail, associateMasterCousreWithBatch };
