import express from "express";
const router = express.Router();

import {
  instructorDetails,
  login,
  logout,
  refreshAccessToken,
} from "../../Controller/Institute/institute.instructor.controller.js";

// Middleware
import { verifyInstituteInstructorJWT } from "../../MiddleWare/verifyJWTToken.js";

// Auth
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Authantication
router.use(verifyInstituteInstructorJWT);

router.get("/", instructorDetails);
router.put("/logout", logout);

export default router;
