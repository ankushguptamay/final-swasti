import express from "express";
const router = express.Router();

import {
  myDetails,
  updateLearner,
  addUpdateProfilePic,
  deleteProfilePic,
  getMyChakra,
  chakraDetails,
} from "../../../Controller/User/UserProfile/user.controller.js";

// Middleware
import { uploadImage } from "../../../MiddleWare/uploadFile.js";
import {
  myWallet,
  transactionHistory,
} from "../../../Controller/User/UserProfile/wallet.js";

router.get("/", myDetails);
router.put("/", updateLearner);

router.put("/pic", uploadImage.single("profilePic"), addUpdateProfilePic);
router.delete("/pic", deleteProfilePic);

// Chakra
router.get("/chakra", getMyChakra);
router.get("/chakra/:chakraNumber", chakraDetails);

// Wallet/Transcation
router.get("/wallet", myWallet);
router.get("/transaction", transactionHistory);

export default router;
