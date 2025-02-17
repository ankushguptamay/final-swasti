import express from "express";
const router = express.Router();

// import profile from "./profile.js";
import yogaClass from "./yogaClass.js";
import instructor from "./instructor.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";

// router.use("/profile", verifyUserJWT, profile);
router.use("/y-c", verifyUserJWT, yogaClass);
router.use("/inst", verifyUserJWT, instructor);

export default router;
