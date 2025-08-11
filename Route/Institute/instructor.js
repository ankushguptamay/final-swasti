import express from "express";
const router = express.Router();

import {
  instructorDetails,
  loginByMobile,
  verifyMobileOTP,
  logout,
  refreshAccessToken,
} from "../../Controller/Institute/institute.instructor.controller.js";

// Middleware
import { verifyInstituteInstructorJWT } from "../../MiddleWare/verifyJWTToken.js";
import {
  myYCBatchesForIInstructor,
  courseBatchDetailsForInstructor,
} from "../../Controller/Institute/yCBatch.controller.js";
import {
  createYCBatchLesson,
  lessonDetails,
  updateLessonDocument,
  updateYCBatchLesson,
} from "../../Controller/Institute/yCLesson.controller.js";
import { uploadPDF } from "../../MiddleWare/uploadFile.js";

// Auth
router.post("/login", loginByMobile);
router.post("/verify-otp", verifyMobileOTP);
router.post("/refresh", refreshAccessToken);

// Authantication
router.use(verifyInstituteInstructorJWT);

router.get("/", instructorDetails);
router.put("/logout", logout);

router.get("/ycbatch", myYCBatchesForIInstructor); // yoga-course
router.get("ycbatch/:slug", courseBatchDetailsForInstructor); // yoga-course/details
router.post("/ycbatch-lesson", uploadPDF.single("pdf"), createYCBatchLesson); // yoga-course-lesson
router.get("/ycbatch-lesson/:yCLessonId", lessonDetails); // yoga-course-lesson
router.put(
  "/ycbatch-lesson-doc/:yCLessonId",
  uploadPDF.single("pdf"),
  updateLessonDocument
); // yoga-course-lesson-doc
router.put("/ycbatch-lesson/:yCLessonId", updateYCBatchLesson); // yoga-course-lesson

// Master Course

export default router;
