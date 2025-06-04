import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Certificate } from "../Model/User/Profile/certificateModel.js";
import { User } from "../Model/User/Profile/userModel.js";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";
import { getEmbedding } from "./AIFunction.js";

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

async function updateCategory() {
  try {
    let done = 0;
    const category = await YogaCategory.find()
      .select("_id yogaCategory embedding")
      .lean();
    for (let i = 0; i < category.length; i++) {
      // Get Embedding
      if (!category[i].embedding || category[i].embedding.length <= 0) {
        const embedding = await getEmbedding(category[i].yogaCategory);
        await YogaCategory.updateOne(
          { _id: category[i]._id },
          { $set: { embedding } }
        );
        done = done + 1;
      }
    }
    console.log(done);
  } catch (error) {
    console.error("Error:", error);
  }
}

export { connectDB, updateCategory };
