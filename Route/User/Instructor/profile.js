import express from "express";
const router = express.Router();

import {
  myDetails,
  updateInstructor,
  addUpdateProfilePic,
  deleteProfilePic,
  sendAadharOTP,
  verifyAadharOTP,
  isProfileVisible,
} from "../../../Controller/User/user.controller.js";

// Middleware

router.get("/", myDetails);
router.put("/", updateInstructor);

router.put("/profilePic", addUpdateProfilePic);
router.delete("/profilePic", deleteProfilePic);

router.put("/sendAadharOTP", sendAadharOTP);
router.put("/verifyAadharOTP", verifyAadharOTP);
router.put("/isProfileVisible", isProfileVisible);

export default router;
