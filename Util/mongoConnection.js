import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { YogaTutorClass } from "../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: process.env.DB_NAME })
    .then(async (data) => {
      console.log("Database Connected successfully!");
    })
    .catch((err) => {
      throw err;
    });
};

// Drop the entire database put it at line 8
// await mongoose.connection.db.dropDatabase();
// console.log("Database dropped");

async function updateTimeZoneField() {
  try {
    const updateed = await YogaTutorClass.updateMany(
      {},
      { $unset: { userTimeZone: 1 } }
    );
    const result = await YogaTutorClass.updateMany(
      {},
      { $set: { instructorTimeZone: "Asia/Kolkata" } }
    );
    console.log(`Updated ${result.modifiedCount} documents.`);
  } catch (error) {
    console.error("Error updating documents:", error);
  }
}

updateTimeZoneField();

export { connectDB };
