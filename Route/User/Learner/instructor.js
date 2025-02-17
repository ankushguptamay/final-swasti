import express from "express";
const router = express.Router();

import {
  giveOrUpdateInstructorReviews,
  deleteInstructorReviewByUser,
  getInstructorReviews,
  giveReactionOnInstructorReview,
  unGiveReactionOnInstructorReview,
  replyOnMyReviews,
  deleteMyReply,
} from "../../../Controller/User/Review/instructorReview.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";

// Instructor Review
router.get("/review", verifyUserJWT, getInstructorReviews);
router.post("/review", verifyUserJWT, giveOrUpdateInstructorReviews);
router.delete("/review/:id", verifyUserJWT, deleteInstructorReviewByUser);
router.post("/rection/:id", verifyUserJWT, giveReactionOnInstructorReview);
router.delete("/rection/:id", verifyUserJWT, unGiveReactionOnInstructorReview);
router.post("/reply", verifyUserJWT, replyOnMyReviews);
router.delete("/reply", verifyUserJWT, deleteMyReply);

export default router;
