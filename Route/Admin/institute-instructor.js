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
const router = express.Router();

// Institute
router.post("/", registerInstituteByAdmin);
router.get("/", getInstitute);
router.get("/details/:id", instituteDetailsForAdmin);

// Instructor
router.post("/instructor", registerIInstructorByAdmin);
router.get("/instructor", getInstructor);
router.get("/instructor/:id", instituteInstructorDetailsForAdmin);

export default router;
