import express from "express";
const router = express.Router();

import { getAdmin, register, login } from "../../Controller/Admin/authAdmin.js";
import master from "./master.js";

// Middleware
import { verifyAdminJWT } from "../../MiddleWare/verifyJWTToken.js";

// Auth
router.post("/register", register);
router.post("/login", login);

// Authantication
router.use(verifyAdminJWT);

router.get("/", getAdmin);

router.use("/mas", master);

export default router;
