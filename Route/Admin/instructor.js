import express from "express";
const router = express.Router();

import {
  classTimesForAdmin,
  approvalClassTimes,
} from "../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

// specialization
router.put("/y-t-class/:id", approvalClassTimes);
router.get("/y-t-class", classTimesForAdmin);

export default router;
