import express from "express";
const router = express.Router();

import {
  addEducation,
  educationById,
  educations,
  updateEducation,
  deleteEducation,
} from "../../../Controller/User/education.controller.js";

router.post("/", addEducation);
router.get("/", educations);
router.get("/:id", educationById);
router.put("/:id", updateEducation);
router.delete("/:id", deleteEducation);

export default router;
