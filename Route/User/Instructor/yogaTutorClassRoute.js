import express from "express";
const router = express.Router();

import {
  addYTPackage,
  getYTPackage,
  yTPackageDetails,
  updateYTPackage,
  deleteYTPackage,
} from "../../../Controller/User/Service/YogaTutorClass/yTPackage.controller.js";
import {
  addNewAppointmentTimes,
  appointmentTimesForInstructor,
} from "../../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

// Package
router.post("/package", addYTPackage);
router.get("/package", getYTPackage);
router.get("/package/:id", yTPackageDetails);
// router.put("/:id", updateYTPackage);
router.delete("/package/:id", deleteYTPackage);

// Add class
router.post("/", addNewAppointmentTimes);
router.get("/", appointmentTimesForInstructor);

export default router;
