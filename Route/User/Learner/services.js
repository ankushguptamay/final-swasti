import express from "express";
const router = express.Router();

import {
  createPayment,
  cancelOrder,
} from "../../../Controller/User/Service/serviceOrder.controller.js";
import {
  joinMeeting,
  myClassTimesForUser,
} from "../../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

router.post("/createPayment", createPayment);
router.post("/cancelOrder", cancelOrder);

router.put("/joinMeeting/:id", joinMeeting);
router.get("/ytc-booking", myClassTimesForUser);

export default router;
