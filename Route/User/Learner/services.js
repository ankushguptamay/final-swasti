import express from "express";
const router = express.Router();

import {
  createPayment,
  cancelOrder,
} from "../../../Controller/User/Service/serviceOrder.controller.js";

router.post("/createPayment", createPayment);
router.post("/cancelOrder", cancelOrder);

export default router;
