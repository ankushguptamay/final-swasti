import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { User } from "../Model/User/Profile/userModel.js";
import slugify from "slugify";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";
import { CoursePayment } from "../Model/User/Services/Course/coursePaymentModel.js";

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

async function updateStartDate() {
  try {
    const payment = await CoursePayment.find({ amount: { $gt: 5 } });

    for (const pay of payment) {
      if (!pay.startDate) {
        await CoursePayment.updateOne(
          { _id: pay._id },
          { $set: { startDate: new Date("2025-07-23T00:30:00.000Z") } }
        );
      } else if (
        new Date(pay.startDate).getTime() ===
        new Date("2025-07-23T06:00:00.000Z").getTime()
      ) {
        await CoursePayment.updateOne(
          { _id: pay._id },
          { $set: { startDate: new Date("2025-07-23T00:30:00.000Z") } }
        );
      } else if (
        new Date(pay.startDate).getTime() ===
        new Date("2025-08-01T11:00:00.000Z").getTime()
      ) {
        await CoursePayment.updateOne(
          { _id: pay._id },
          { $set: { startDate: new Date("2025-08-01T05:30:00.000Z") } }
        );
      } else if (
        new Date(pay.startDate).getTime() ===
        new Date("2025-08-01T06:00:00.000Z").getTime()
      ) {
        await CoursePayment.updateOne(
          { _id: pay._id },
          { $set: { startDate: new Date("2025-08-01T00:30:00.000Z") } }
        );
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error("Error updating start dates:", err);
  } finally {
    process.exit();
  }
}

export { connectDB, addBrevoEmail, updateStartDate };
