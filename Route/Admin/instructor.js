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

// Yoga tutor class
router.put("/y-t-class/:id", approvalClassTimes);
router.get("/y-t-class", classTimesForAdmin);

// certificate
router.put("/certificate/:id", certificatesForAdminApproval);
router.get("/certificate", certifiacteApproval);
router.get("/certificate/:id", certificateById);

export default router;
