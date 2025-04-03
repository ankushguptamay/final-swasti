import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { YogaTutorClass } from "../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";

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

async function dropCollection() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(collections);
    await mongoose.connection.db.dropCollection("ytclassslots");
    console.log("Collection YTClassSlot deleted successfully.");
    await mongoose.connection.db.dropCollection("yogatutorclasses");
    console.log("Collection YogaTutorClass deleted successfully.");
    await mongoose.connection.db.dropCollection("ytclassupdatehistories");
    console.log("Collection YTClassUpdateHistory deleted successfully.");
    await mongoose.connection.db.dropCollection("yogatutorpackages");
    console.log("Collection YogaTutorPackage deleted successfully.");
    await mongoose.connection.db.dropCollection("yogatutorpackagehistories");
    console.log("Collection YogaTutorPackageHistory deleted successfully.");
  } catch (error) {
    console.error("Error deleting collection:", error);
  }
}

export { connectDB, dropCollection };
