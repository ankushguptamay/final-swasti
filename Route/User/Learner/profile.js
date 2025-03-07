import express from "express";
const router = express.Router();

import {
  myDetails,
  updateLearner,
  addUpdateProfilePic,
  deleteProfilePic,
  getMyChakra,
  chakraDetails,
  myWallet,
} from "../../../Controller/User/UserProfile/user.controller.js";

// Middleware
import { uploadImage } from "../../../MiddleWare/uploadFile.js";

router.get("/", myDetails);
router.put("/", updateLearner);

router.put("/pic", uploadImage.single("profilePic"), addUpdateProfilePic);
router.delete("/pic", deleteProfilePic);

// Chakra
router.get("/chakra", getMyChakra);
router.get("/chakra/:chakraNumber", chakraDetails);

// Wallet/Transcation
router.get("/wallet", myWallet);

export default router;
