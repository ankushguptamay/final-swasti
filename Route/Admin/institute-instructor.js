import express from "express";
import {
  getInstitute,
  instituteDetailsForAdmin,
  registerByAdmin,
} from "../../Controller/Institute/institute.controller.js";
const router = express.Router();

// Institute
router.post("/", registerByAdmin);
router.get("/", getInstitute);
router.get("/:id", instituteDetailsForAdmin);

export default router;
