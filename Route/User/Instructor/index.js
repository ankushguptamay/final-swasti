import express from "express";
const router = express.Router();

import profile from "./profile.js";
import bankDetails from "./bankDetailsRoute.js";
import certificate from "./certificateRoute.js";
import education from "./educationRoute.js";
import yTClass from "./yogaTutorClassRoute.js";
import master from "./masterDetailsRoute.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";
import { failureResponse } from "../../../MiddleWare/responseMiddleware.js";

// Authantication
router.use(verifyUserJWT);

// Validate instructor role
router.use((req, res, next) => {
  if (!req.user.role || req.user.role.toLowerCase() !== "instructor") {
    return failureResponse(res, 401, "Unauthorized!", null);
  }
  next();
});

router.use("/profile", profile);
router.use("/bankDetail", bankDetails);
router.use("/certificate", certificate);
router.use("/education", education);
router.use("/y-t-class", yTClass);
router.use("/mas", master);

export default router;
