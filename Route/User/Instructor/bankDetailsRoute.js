import express from "express";
const router = express.Router();

import {
  addBankDetails,
  bankDetailById,
  bankDetails,
  deleteBankDetails,
} from "../../../Controller/User/UserProfile/bankDetails.controller.js";

router.post("/", addBankDetails);
router.get("/", bankDetails);
router.get("/:id", bankDetailById);
router.delete("/:id", deleteBankDetails);

export default router;
