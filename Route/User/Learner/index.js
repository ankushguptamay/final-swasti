import express from "express";
const router = express.Router();

import profile from "./profile.js";
import instructor from "./instructor.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";
import { failureResponse } from "../../../MiddleWare/responseMiddleware.js";

// Authantication
router.use(verifyUserJWT);

// Validate instructor role
router.use((req, res, next) => {
  if (!req.user.role || req.user.role.toLowerCase() !== "learner") {
    return failureResponse(res, 401, "Unauthorized", null);
  }
  next();
});

router.use("/profile", profile);
router.use("/inst", instructor);

export default router;
