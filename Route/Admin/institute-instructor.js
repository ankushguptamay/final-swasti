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
  courseDetailsForAdmin,
  createYogaCourse,
  getCourse,
  reAssignCourseToInstructor,
} from "../../Controller/Institute/yogaCourses.controller.js";
import { reAssignCoursesToUser } from "../../Controller/User/Service/Course/payment.controller.js";

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
router.get("/yoga-course/:id", courseDetailsForAdmin);
router.put("/yoga-course-reassign-inst", reAssignCourseToInstructor);
router.put("/yoga-course-reassign-user", reAssignCoursesToUser);

export default router;
