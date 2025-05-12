import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Certificate } from "../Model/User/Profile/certificateModel.js";
import { User } from "../Model/User/Profile/userModel.js";

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

async function updateCertificates() {
  try {
    const result = await Certificate.updateMany(
      { approvalByAdmin: { $exists: false } }, // only update documents missing the field
      { $set: { approvalByAdmin: "pending" } }
    );

    console.log(`Updated ${result.modifiedCount} certificates`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function updateCertificatesForUser() {
  try {
    const result = await User.updateMany(
      { createdAt: { $exists: true } }, // only update documents missing the field
      { $set: { certificate: [] } }
    );

    console.log(`Updated ${result.modifiedCount} certificates user`);
  } catch (error) {
    console.error("Error:", error);
  }
}

export {
  connectDB,
  dropCollection,
  updateCertificates,
  updateCertificatesForUser,
};
