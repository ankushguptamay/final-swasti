import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
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

// async function updateExistingUsers() {
//   try {
//     const result = await User.updateMany(
//       { isAadharVerified: { $exists: false } },
//       { $set: { isAadharVerified: false } }
//     );
//     console.log(`${result.modifiedCount} documents updated.`);
//   } catch (error) {
//     console.error("Error updating documents:", error);
//   }
// }

// updateExistingUsers();

export { connectDB };
