import express from "express";
const router = express.Router();

import {
  searchUser,
  getUserReferral,
  usersReferral,
  userCount,
  userDetails,
} from "../../Controller/Admin/user.controller.js";
import { contactUs } from "../../Controller/Admin/contactUs.controller.js";

// User
router.get("/", searchUser);
router.get("/detailes/:id", userDetails);
router.get("/count", userCount);
router.get("/referral", usersReferral);
router.get("/refferalDetails/:rfC", getUserReferral);

router.get("/contactUs", contactUs);

export default router;
