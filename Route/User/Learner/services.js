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

router.post("/createPayment", createPayment);
router.post("/cancelOrder/:id", cancelOrder);

router.put("/joinMeeting/:id", joinMeeting);
router.get("/ytc-booking", myClassTimesForUser);
router.get("/ytc-booking/:id", bookedClassTimesDetails);

router.get("/courses", getMyYCBatchs);

export default router;
