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
import {
  createClassPaymentByRazorpayAndRegisterUser,
  verifyPayment,
} from "../../Controller/User/Service/serviceOrder.controller.js";
import { getBanner } from "../../Controller/Master/banner.controller.js";
import {
  applyCourseCoupon,
  verifyCoursePaymentByRazorpay,
  verifyCoursePaymentByPhonepe,
  createCourseOrderByPhonepeAndRegisterUser,
  createCourseOrderByRazorpayAndRegisterUser,
  razorpay_course_webhook,
} from "../../Controller/User/Service/Course/payment.controller.js";
import { recordForHero } from "../../Controller/User/dashboard.js";
import { createSubscribedUser } from "../../Controller/User/UserProfile/subscribedUser.controller.js";
import {
  getBlogBySlugForUser,
  getBlogsForUser,
} from "../../Controller/Admin/blog.controller.js";
import {
  yogaCourse,
  yogaCourseDetails,
} from "../../Controller/Master/yogaCourse.controller.js";

// Landing page
router.get("/instructor", searchInstructor);
router.get("/landing-instructor", instructorForLandingPage);
router.get("/instructor/:slug", instructorDetailsForLearner);
router.post("/contactUs", addContactUs);
router.get("/yt-class", classTimesForUser);
router.get("/specialization", getSpecialization);
router.get("/y-c", getYogaCategory);
router.get("/y-c/:slug", yogaCategoryDetailsForUser);
router.get("/y-c-i", getYogaCategoryWithImage);
router.get("/banner", getBanner);
router.get("/heroRecord", recordForHero);
router.post("/subscrib", createSubscribedUser);

router.post(
  "/createClassOrder-newUser-ra",
  createClassPaymentByRazorpayAndRegisterUser
);
router.post("/verifyPayment", verifyPayment);

// Yoga Course
router.get("/yogacourse", yogaCourse);
router.get("/yogacourse/:slug", yogaCourseDetails);
// Yoga Course payment Route
// router.post(
//   "/createCourseOrder-newUser-ph",
//   createCourseOrderByPhonepeAndRegisterUser
// );
router.post(
  "/createCourseOrder-newUser-ra",
  createCourseOrderByRazorpayAndRegisterUser
);
router.post("/verifyCoursePayment-ra", verifyCoursePaymentByRazorpay);
// router.get("/verifyCoursePayment-ph/:receipt", verifyCoursePaymentByPhonepe);
router.post("/applyCourseCoupon", applyCourseCoupon);
router.post("/course-webhook", razorpay_course_webhook);

// Blog
router.get("/blog", getBlogsForUser);
router.get("/blog/:slug", getBlogBySlugForUser);

export default router;
