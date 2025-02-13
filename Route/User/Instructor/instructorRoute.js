import express from "express";
const router = express.Router();

import profile from "./profile.js";
import bankDetails from "./bankDetailsRoute.js";
import certificate from "./certificateRoute.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";

router.use("/profile", verifyUserJWT, profile);
router.use("/bankDetail", verifyUserJWT, bankDetails);
router.use("/certificate", verifyUserJWT, certificate);

export default router;
