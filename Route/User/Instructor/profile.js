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
import {
  uploadImage,
  uploadImageAndPDF,
  uploadPDF,
} from "../../../MiddleWare/uploadFile.js";

router.get("/", myDetails);
router.put("/", updateInstructor);

router.put(
  "/pic",
  uploadImage.single("profilePic"),
  addUpdateProfilePic
);
router.delete("/pic", deleteProfilePic);

router.put("/sendAadharOTP", sendAadharOTP);
router.put("/verifyAadharOTP", verifyAadharOTP);
router.put("/isProfileVisible", isProfileVisible);

export default router;
