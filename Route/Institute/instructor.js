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
import { myCourseForIInstructor } from "../../Controller/Institute/yogaCourses.controller.js";
import {
  createYogaCourseLesson,
  updateYogaCourseLesson,
} from "../../Controller/Institute/yCLesson.controller.js";

// Auth
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Authantication
router.use(verifyInstituteInstructorJWT);

router.get("/", instructorDetails);
router.put("/logout", logout);

router.get("/yoga-course", myCourseForIInstructor);
router.post("/yoga-course-lesson", createYogaCourseLesson);
router.put("/yoga-course-lesson/:yCLessonId", updateYogaCourseLesson);

export default router;
