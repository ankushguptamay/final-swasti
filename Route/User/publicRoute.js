import express from "express";
const router = express.Router();

import {
  instructorDetailsForLearner,
  searchInstructor,
  instructorForLandingPage,
} from "../../Controller/User/UserProfile/user.controller.js";
import { addContactUs } from "../../Controller/Admin/contactUs.controller.js";
import { classTimesForUser } from "../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";
import { getSpecialization } from "../../Controller/Master/specialization.controller.js";
import {
  getYogaCategory,
  getYogaCategoryWithImage,
} from "../../Controller/Master/yogaCategory.controller.js";
import { verifyPayment } from "../../Controller/User/Service/serviceOrder.controller.js";
import { getBanner } from "../../Controller/Master/banner.controller.js";
import {
  applyCourseCoupon,
  verifyCoursePayment,
} from "../../Controller/User/Service/Course/payment.controller.js";

router.get("/instructor", searchInstructor);
router.get("/landing-instructor", instructorForLandingPage);
router.get("/instructor/:id", instructorDetailsForLearner);

router.post("/contactUs", addContactUs);

router.get("/yt-class", classTimesForUser);

router.get("/specialization", getSpecialization);

router.get("/y-c", getYogaCategory);
router.get("/y-c-i", getYogaCategoryWithImage);

router.post("/verifyPayment", verifyPayment);

router.get("/banner", getBanner);

// Course Route
router.post("/verifyCoursePayment", verifyCoursePayment);
router.post("/applyCourseCoupon", applyCourseCoupon);

export default router;
