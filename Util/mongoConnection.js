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
    // Rename 'userTimeZone' to 'instructorTimeZone'
    const result = await YogaTutorClass.updateMany(
      { userTimeZone: { $exists: true } }, // Only update documents where userTimeZone exists
      { $rename: { userTimeZone: "instructorTimeZone" } }
    );
    console.log(`Updated ${result.modifiedCount} documents.`);
  } catch (error) {
    console.error("Error updating documents:", error);
  }
}

// updateTimeZoneField();

export { connectDB };
