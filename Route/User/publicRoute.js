import express from "express";
const router = express.Router();

import {
  instructorDetailsForLearner,
  searchInstructor,
} from "../../Controller/User/UserProfile/user.controller.js";
import { addContactUs } from "../../Controller/Admin/contactUs.controller.js";
import { classTimesForUser } from "../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";
import { getSpecialization } from "../../Controller/Master/specialization.controller.js";
import { getYogaCategory } from "../../Controller/Master/yogaCategory.controller.js";
import { verifyPayment } from "../../Controller/User/Service/serviceOrder.controller.js";

router.get("/instructor", searchInstructor);
router.get("/instructor/:id", instructorDetailsForLearner);

router.post("/contactUs", addContactUs);

router.get("/yt-class", classTimesForUser);

router.get("/specialization", getSpecialization);

router.get("/y-c", getYogaCategory);

router.post("/verifyPayment", verifyPayment);

export default router;
