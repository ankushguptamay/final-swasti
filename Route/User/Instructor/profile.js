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
} from "../../../Controller/User/UserProfile/user.controller.js";
import {
  getReviews,
  giveUnGiveReactionOnReview,
  replyOnMyReviews,
  deleteMyReply,
  getReviewDetails,
} from "../../../Controller/User/Review/instructorReview.js";

// Middleware
import { uploadImage } from "../../../MiddleWare/uploadFile.js";
import { instructorDashBoard } from "../../../Controller/User/dashboard.js";
import {
  myWallet,
  transactionHistory,
} from "../../../Controller/User/UserProfile/wallet.js";
import {
  myNotification,
  notificationDetails,
  readNotification,
  seenNotification,
} from "../../../Controller/Notification/notification.js";

router.get("/", myDetails);
router.put("/", updateInstructor);

router.put("/pic", uploadImage.single("profilePic"), addUpdateProfilePic);
router.delete("/pic", deleteProfilePic);

router.put("/sendAadharOTP", sendAadharOTP);
router.put("/verifyAadharOTP", verifyAadharOTP);
router.put("/publish", isProfileVisible);

// Chakra
router.get("/chakra", getMyChakra);
router.get("/chakra/:chakraNumber", chakraDetails);

// Review
router.get("/review", getReviews);
// router.get("/review/:id", getReviewDetails);
router.post("/reaction/:id", giveUnGiveReactionOnReview);
router.post("/reply", replyOnMyReviews);
router.delete("/reply", deleteMyReply);

// Wallet/Transcation
router.get("/wallet", myWallet);
router.get("/transaction", transactionHistory);

// Dashboard
router.get("/dashboard", instructorDashBoard);

// Notification
router.get("/noti", myNotification);
router.get("/noti/:id", notificationDetails);
router.put("/noti-seen", seenNotification);
router.put("/noti-read", readNotification);

export default router;
