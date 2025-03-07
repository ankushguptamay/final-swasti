import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "../Model/User/Profile/userModel.js";
import { Wallet } from "../Model/User/Profile/walletModel.js";

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

// async function createWallet() {
//   try {
//     const result = await User.find();
//     let num = 0;
//     for (let i = 0; i < result.length; i++) {
//       await Wallet.findOneAndUpdate(
//         { userId: result[i]._id },
//         { updatedAt: new Date() },
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );
//       num = i;
//     }
//     console.log(`${num} done.`);
//   } catch (error) {
//     console.error("Error updating documents:", error);
//   }
// }

// createWallet();

export { connectDB };
