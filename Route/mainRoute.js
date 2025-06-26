import express from "express";
const router = express.Router();

// Routes
import admin from "./Admin/authAdmin.js";
import authUser from "./User/authUser.js";
import instructor from "./User/Instructor/index.js";
import learner from "./User/Learner/index.js";

// Routes
router.use("/api/auth", authUser);
// 1.Instructor
router.use("/api/instructor", instructor);
// 2.User
router.use("/api/user", learner);
// 3.User
router.use("/api/admin", admin);

export default router;
