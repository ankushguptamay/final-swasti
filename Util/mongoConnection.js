import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { CoursePayment } from "../Model/User/Services/Course/coursePaymentModel.js";
import { YogaCourse } from "../Model/Institute/yogaCoursesMode.js";

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

async function associateCousreWithPayment() {
  try {
    const payment = await CoursePayment.find({ amount: { $gt: 5 } }).lean();
    for (let i = 0; i < payment.length; i++) {
      const yogaCourse = await YogaCourse.findOne({
        name: payment[i].courseName,
        startDate: new Date(payment[i].startDate),
        totalEnroll: { $lt: 30 },
      })
        .select("_id")
        .lean();
      let courseId;
      if (!yogaCourse) {
        const endDate = new Date(payment[i].startDate);
        endDate.setDate(endDate.getDate() + 45);
        const courseDescription = await YogaCourse.findOne({
          name: payment[i].courseName,
        })
          .select("_id description")
          .lean();
        const newCourse = await YogaCourse.create({
          name: payment[i].courseName,
          description: courseDescription?.description || undefined,
          startDate: new Date(payment[i].startDate),
          endDate,
          amount: parseFloat(payment[i].amount),
        });
        courseId = newCourse._id;
      } else {
        courseId = yogaCourse._id;
      }
      await CoursePayment.updateOne(
        { _id: payment[i]._id },
        { $set: { yogaCourse: courseId } }
      );
      if (payment[i].status === "completed")
        await YogaCourse.updateOne(
          { _id: courseId },
          { $inc: { totalEnroll: 1 } }
        );
    }
    console.log("Done.");
  } catch (err) {
    console.error("Error updating start dates:", err);
  }
}

export { connectDB, addBrevoEmail, associateCousreWithPayment };
