import express from "express";
const router = express.Router();

import {
  instituteDetails,
  loginByMobile,
  verifyMobileOTP,
  logout,
  refreshAccessToken,
} from "../../Controller/Institute/institute.controller.js";
import {
  yogaCourse,
  yogaCourseDetails,
  yogaCourseForDropdown,
} from "../../Controller/Master/yogaCourse.controller.js";
import {
  getInstructorForInstitute,
  instituteInstructorDetailsForInstitute,
  registerIInstructor,
} from "../../Controller/Institute/institute.instructor.controller.js";

import instructor from "./instructor.js";

// Middleware
import { verifyInstituteJWT } from "../../MiddleWare/verifyJWTToken.js";
import {
  courseBatchDetailsForII,
  myYCBatchesForInstitute,
  reAssignYCBatchToInstructor,
} from "../../Controller/Institute/yCBatch.controller.js";

// Auth
router.post("/login", loginByMobile);
router.post("/verify-otp", verifyMobileOTP);
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

// Institutes Instructor
router.post("/register-instructor", registerIInstructor);
router.get("/my-instructor", getInstructorForInstitute);
router.get("/my-instructor/:slug", instituteInstructorDetailsForInstitute);

// Course Batches
router.put("/ycbatch-reassign-inst", reAssignYCBatchToInstructor);
router.get("/ycbatch", myYCBatchesForInstitute);
router.get("/ycbatch/:slug", courseBatchDetailsForII);

export default router;
