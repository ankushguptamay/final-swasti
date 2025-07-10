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
  yogaCategoryDetailsForUser,
} from "../../Controller/Master/yogaCategory.controller.js";
import { verifyPayment } from "../../Controller/User/Service/serviceOrder.controller.js";
import { getBanner } from "../../Controller/Master/banner.controller.js";
import {
  applyCourseCoupon,
  verifyCoursePaymentByRazorpay,
  verifyCoursePaymentByPhonepe,
  createCourseOrderByPhonepeAndRegisterUser,
} from "../../Controller/User/Service/Course/payment.controller.js";
import { recordForHero } from "../../Controller/User/dashboard.js";
import { createSubscribedUser } from "../../Controller/User/UserProfile/subscribedUser.controller.js";
import {
  getBlogBySlug,
  getBlogsForUser,
} from "../../Controller/Admin/blog.controller.js";

router.get("/instructor", searchInstructor);
router.get("/landing-instructor", instructorForLandingPage);
router.get("/instructor/:slug", instructorDetailsForLearner);

router.post("/contactUs", addContactUs);

router.get("/yt-class", classTimesForUser);

router.get("/specialization", getSpecialization);

router.get("/y-c", getYogaCategory);
router.get("/y-c/:slug", yogaCategoryDetailsForUser);
router.get("/y-c-i", getYogaCategoryWithImage);

router.post("/verifyPayment", verifyPayment);

router.get("/banner", getBanner);

// Course Route
router.post(
  "/createCourseOrder-newUser-ph",
  createCourseOrderByPhonepeAndRegisterUser
);
router.post("/verifyCoursePayment-ra", verifyCoursePaymentByRazorpay);
router.get("/verifyCoursePayment-ph/:receipt", verifyCoursePaymentByPhonepe);
router.post("/applyCourseCoupon", applyCourseCoupon);

router.get("/heroRecord", recordForHero);

router.post("/subscrib", createSubscribedUser);

// Blog
router.get("/blog", getBlogsForUser);
router.get("/blog/:slug", getBlogBySlug);

export default router;
