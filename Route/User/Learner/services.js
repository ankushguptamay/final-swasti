import express from "express";
const router = express.Router();

import {
  createPayment,
  cancelOrder,
} from "../../../Controller/User/Service/serviceOrder.controller.js";
import {
  joinMeeting,
  myClassTimesForUser,
  bookedClassTimesDetails,
} from "../../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";
import { getMyYCBatchs } from "../../../Controller/User/Service/Course/payment.controller.js";
import {
  getYCReviews,
  giveOrUpdateYCReviews,
} from "../../../Controller/Institute/yCReview.controller.js";
import { createYCBRegistrationForm } from "../../../Controller/Institute/YCB_registration_form.controller.js";

// Middleware
import { uploadImageAndPDF } from "../../../MiddleWare/uploadFile.js";

router.post("/createPayment", createPayment);
router.post("/cancelOrder/:id", cancelOrder);

router.put("/joinMeeting/:id", joinMeeting);
router.get("/ytc-booking", myClassTimesForUser);
router.get("/ytc-booking/:id", bookedClassTimesDetails);

router.get("/courses", getMyYCBatchs);
router.post("/courses-review", giveOrUpdateYCReviews);
router.get("/courses-review/:yCId", getYCReviews);
router.post(
  "/ycb-registration-form",
  uploadImageAndPDF.fields([
    { name: "id_image", maxCount: 1 },
    { name: "face_pic", maxCount: 1 },
  ]),
  createYCBRegistrationForm
);

export default router;
