import express from "express";
const router = express.Router();

import {
  searchUser,
  getUserReferral,
  usersReferral,
  userCount,
} from "../../Controller/Admin/user.controller.js";

// User
router.get("/", searchUser);
router.get("/count", userCount);
router.get("/referral", usersReferral);
router.get("/refferalDetails/:rfC", getUserReferral);

export default router;
