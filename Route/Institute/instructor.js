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
import {
  myCourseForIInstructor,
  courseBatchDetailsForInstructor,
} from "../../Controller/Institute/yogaCourses.controller.js";
import {
  createYogaCourseLesson,
  lessonDetails,
  updateLessonDocument,
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
router.get("/yoga-course/details/:slug", courseBatchDetailsForInstructor);
router.post("/yoga-course-lesson", createYogaCourseLesson);
router.get("/yoga-course-lesson/:yCLessonId", lessonDetails);
router.put("/yoga-course-lesson-doc/:yCLessonId", updateLessonDocument);
router.put("/yoga-course-lesson/:yCLessonId", updateYogaCourseLesson);

export default router;
