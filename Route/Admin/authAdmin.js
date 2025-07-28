import express from "express";
const router = express.Router();

import { getAdmin, register, login } from "../../Controller/Admin/authAdmin.js";
import master from "./master.js";
import instructor from "./instructor.js";
import user from "./user.js";
import blog from "./blog.js";
import institute from "./institute-instructor.js";

// Middleware
import { verifyAdminJWT } from "../../MiddleWare/verifyJWTToken.js";

// Auth
router.post("/register", register);
router.post("/login", login);

// Authantication
router.use(verifyAdminJWT);

router.get("/", getAdmin);

router.use("/mas", master);
router.use("/ins", instructor);
router.use("/user", user);
router.use("/blog", blog);
router.use("/institute", institute);

export default router;
