import express from "express";
const router = express.Router();

import {
  classTimesForAdmin,
  approvalClassTimes,
} from "../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";
import {
  certifiacteApproval,
  certificateById,
  certificatesForAdminApproval,
} from "../../Controller/User/UserProfile/certificate.controller.js";
import { getCoursePayment } from "../../Controller/User/Service/Course/payment.controller.js";

// Yoga tutor class
router.put("/y-t-class/:id", approvalClassTimes);
router.get("/y-t-class", classTimesForAdmin);

// certificate
router.get("/certificate", certificatesForAdminApproval);
router.put("/certificate/:id", certifiacteApproval);
router.get("/certificate/:id", certificateById);
// CoursePayment
router.get("/coursePayment", getCoursePayment);

export default router;
