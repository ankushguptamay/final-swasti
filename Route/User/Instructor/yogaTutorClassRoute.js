import express from "express";
const router = express.Router();

import {
  addNewClassTimes,
  classTimesForInstructor,
  updateYTClassTimes,
  classTimesDetailsForInstructor,
  deleteYTClassTimes,
} from "../../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

// Add class
router.post("/", addNewClassTimes);
router.get("/", classTimesForInstructor);
router.get("/:id", classTimesDetailsForInstructor);
router.put("/:id", updateYTClassTimes);
router.delete("/:id", deleteYTClassTimes);

export default router;
