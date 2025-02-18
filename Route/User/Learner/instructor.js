import express from "express";
const router = express.Router();
import { searchInstructor } from "../../../Controller/User/UserProfile/user.controller.js";
import {
  giveOrUpdateReviews,
  deleteReviewByUser,
  getReviews,
  giveUnGiveReactionOnReview,
  replyOnMyReviews,
  deleteMyReply,
  getReviewDetails,
} from "../../../Controller/User/Review/instructorReview.js";

// Instructor
router.get("/", searchInstructor);
// Instructor Review
router.get("/review", getReviews);
router.get("/review/:id", getReviewDetails);
router.post("/review", giveOrUpdateReviews);
router.delete("/review/:id", deleteReviewByUser);
router.post("/reaction/:id", giveUnGiveReactionOnReview);
router.post("/reply", replyOnMyReviews);
router.delete("/reply", deleteMyReply);

export default router;
