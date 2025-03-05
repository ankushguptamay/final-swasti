import express from "express";
const router = express.Router();

import { getAdmin, register, login } from "../../Controller/Admin/authAdmin.js";
import master from "./master.js";
import instructor from "./instructor.js";

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

export default router;
