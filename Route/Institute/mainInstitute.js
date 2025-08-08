import express from "express";
const router = express.Router();

import {
  instituteDetails,
  login,
  logout,
  refreshAccessToken,
} from "../../Controller/Institute/institute.controller.js";
import {
  yogaCourse,
  yogaCourseDetails,
  yogaCourseForDropdown,
} from "../../Controller/Master/yogaCourse.controller.js";
import instructor from "./instructor.js";

// Middleware
import { verifyInstituteJWT } from "../../MiddleWare/verifyJWTToken.js";

// Auth
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Instructor routes
router.use("/instructor", instructor);

// Authantication
router.use(verifyInstituteJWT);

router.get("/", instituteDetails);
router.put("/logout", logout);

// master yoga course
router.get("/yogacourse", yogaCourse);
router.get("/yogacourse/:slug", yogaCourseDetails);
router.get("/yc-dropdown", yogaCourseForDropdown);

export default router;
