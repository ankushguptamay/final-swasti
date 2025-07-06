import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { User } from "../Model/User/Profile/userModel.js";
import slugify from "slugify";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";

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

async function addCategorySlug() {
  const categories = await YogaCategory.find({ slug: { $exists: false } });

  for (const user of categories) {
    const baseSlug = slugify(user.yogaCategory, { lower: true, strict: true });
    user.slug = baseSlug;
    await user.save();
    console.log(`Generated slug for ${user.name}: ${user.slug}`);
  }

  console.log("Slug generation completed.");
  process.exit();
}

export { connectDB, addBrevoEmail, addCategorySlug };
