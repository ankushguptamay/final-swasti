import express from "express";
const router = express.Router();

import {
  addNewClassTimes,
  classTimesForInstructor,
  updateYTClassTimes,
  classTimesDetailsForInstructor,
  deleteYTClassTimes,
  joinMeeting,
  classTimesBookedForInstructor,
  bookedClassTimesDetails,
} from "../../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

// Add class
router.post("/", addNewClassTimes);
router.get("/", classTimesForInstructor);
router.get("/booked", classTimesBookedForInstructor);
router.get("/booked/:id", bookedClassTimesDetails);
router.put("/joinMeeting/:id", joinMeeting);
router.get("/:id", classTimesDetailsForInstructor);
router.put("/:id", updateYTClassTimes);
router.delete("/:id", deleteYTClassTimes);

export default router;
