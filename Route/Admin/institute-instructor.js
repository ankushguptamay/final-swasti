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
  batchDetails,
  createYCBatch,
  getCourseBatch,
  getYCBtachForDropDown,
  reAssignYCBatchToInstructor,
} from "../../Controller/Institute/yCBatch.controller.js";
import { reAssignCoursesToUser } from "../../Controller/User/Service/Course/payment.controller.js";
import {
  createYCBatchLesson,
  updateYCBatchLesson,
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
router.post("/ycbatch", createYCBatch); // yoga-course
router.get("/ycbatch", getCourseBatch); // yoga-course
router.get("/ycbatch-dd", getYCBtachForDropDown); // yoga-course-dd
router.get("/ycbatch/:id", batchDetails); // yoga-course
router.put("/ycbatch-reassign-inst", reAssignYCBatchToInstructor); // yoga-course-reassign-inst
router.put("/ycbatch-reassign-user/:paymentId", reAssignCoursesToUser); // yoga-course-reassign-user
router.post("/ycbatch-lesson", uploadPDF.single("pdf"), createYCBatchLesson); // yoga-course-lesson
router.get("/ycbatch-lesson/:yCLessonId", lessonDetails); // yoga-course-lesson
router.put(
  "/ycbatch-lesson-doc/:yCLessonId",
  uploadPDF.single("pdf"),
  updateLessonDocument
); // yoga-course-lesson-doc
router.delete("/ycbatch-lesson-doc/:yCLessonId", deleteLessonDocument); // yoga-course-lesson-doc
router.put("/ycbatch-lesson/:yCLessonId", updateYCBatchLesson); //yoga-course-lesson

export default router;
