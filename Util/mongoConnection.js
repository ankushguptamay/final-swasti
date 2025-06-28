import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { EmailCredential } from "../Model/User/emailCredentials.js";
import { User } from "../Model/User/Profile/userModel.js";
import slugify from "slugify";

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

function numberToAlpha(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  do {
    result = chars[n % 26] + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

async function addUserSlug() {
  const users = await User.find({ slug: { $exists: false } });

  for (const user of users) {
    const baseSlug = slugify(user.name, { lower: true, strict: true });

    const regex = new RegExp(`^${baseSlug}-[a-z]+$`);
    const existingSlugs = await User.find({ slug: regex }).select("slug");

    const suffixes = existingSlugs.map((u) =>
      u.slug.replace(`${baseSlug}-`, "")
    );
    let index = 0;
    while (suffixes.includes(numberToAlpha(index))) {
      index++;
    }

    const suffix = numberToAlpha(index);
    user.slug = `${baseSlug}-${suffix}`;
    await user.save();
    console.log(`Generated slug for ${user.name}: ${user.slug}`);
  }

  console.log("Slug generation completed.");
  process.exit();
}

export { connectDB, addBrevoEmail, addUserSlug };
