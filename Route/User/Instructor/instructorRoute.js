import express from "express";
const router = express.Router();

import profile from "./profile.js";
import bankDetails from "./bankDetailsRoute.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";

router.use("/profile", verifyUserJWT, profile);
router.use("/bankDetails", verifyUserJWT, bankDetails);

export default router;
