import express from "express";
const router = express.Router();

import profile from "./profile.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";

router.use("/profile", verifyUserJWT, profile);

export default router;
