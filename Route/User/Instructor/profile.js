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
  getMyChakra,
  chakraDetails,
} from "../../../Controller/User/user.controller.js";

// Middleware
import { uploadImage } from "../../../MiddleWare/uploadFile.js";

router.get("/", myDetails);
router.put("/", updateInstructor);

router.put("/pic", uploadImage.single("profilePic"), addUpdateProfilePic);
router.delete("/pic", deleteProfilePic);

router.put("/sendAadharOTP", sendAadharOTP);
router.put("/verifyAadharOTP", verifyAadharOTP);
router.put("/publish", isProfileVisible);

router.get("/chakra", getMyChakra);
router.get("/chakra/:chakraNumber", chakraDetails);

export default router;
