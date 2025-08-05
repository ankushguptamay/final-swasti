import express from "express";
import {
  getInstitute,
  instituteDetailsForAdmin,
  registerInstituteByAdmin,
} from "../../Controller/Institute/institute.controller.js";
import {
  getInstructor,
  registerIInstructorByAdmin,
  instituteInstructorDetailsForAdmin,
} from "../../Controller/Institute/institute.instructor.controller.js";
import {
  courseDetails,
  createYogaCourse,
  getCourse,
  getCourseForDropDown,
  reAssignCourseToInstructor,
} from "../../Controller/Institute/yogaCourses.controller.js";
import { reAssignCoursesToUser } from "../../Controller/User/Service/Course/payment.controller.js";
import {
  createYogaCourseLesson,
  updateYogaCourseLesson,
  updateLessonDocument,
  deleteLessonDocument,
  lessonDetails,
} from "../../Controller/Institute/yCLesson.controller.js";
import { uploadPDF } from "../../MiddleWare/uploadFile.js";

const router = express.Router();

// Institute
router.post("/", registerInstituteByAdmin);
router.get("/", getInstitute);
router.get("/details/:id", instituteDetailsForAdmin);

// Instructor
router.post("/instructor", registerIInstructorByAdmin);
router.get("/instructor", getInstructor);
router.get("/instructor/:id", instituteInstructorDetailsForAdmin);

// Yoga Courses
router.post("/yoga-course", createYogaCourse);
router.get("/yoga-course", getCourse);
router.get("/yoga-course-dd", getCourseForDropDown);
router.get("/yoga-course/:id", courseDetails);
router.put("/yoga-course-reassign-inst", reAssignCourseToInstructor);
router.put("/yoga-course-reassign-user/:paymentId", reAssignCoursesToUser);
router.post(
  "/yoga-course-lesson",
  uploadPDF.single("pdf"),
  createYogaCourseLesson
);
router.get("/yoga-course-lesson/:yCLessonId", lessonDetails);
router.put(
  "/yoga-course-lesson-doc/:yCLessonId",
  uploadPDF.single("pdf"),
  updateLessonDocument
);
router.delete("/yoga-course-lesson-doc/:yCLessonId", deleteLessonDocument);
router.put("/yoga-course-lesson/:yCLessonId", updateYogaCourseLesson);

export default router;
