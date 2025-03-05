import express from "express";
const router = express.Router();

import {
  classTimesForAdmin,
  approvalClassTimes,
  classTimesUpdationRequest,
  approvalClassTimesUpdate,
} from "../../Controller/User/Service/YogaTutorClass/yogaTutor.controller.js";

// specialization
router.put("/y-t-class/:id", approvalClassTimes);
router.get("/y-t-class", classTimesForAdmin);
router.put("/y-t-class-update/:id", approvalClassTimesUpdate);
router.get("/y-t-class-update", classTimesUpdationRequest);

export default router;
