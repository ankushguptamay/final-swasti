import express from "express";
const router = express.Router();

import {
  searchUser,
  getUserReferral,
} from "../../Controller/Admin/user.controller.js";

// User
router.get("/", searchUser);
router.get("/refferalData", getUserReferral);

export default router;
